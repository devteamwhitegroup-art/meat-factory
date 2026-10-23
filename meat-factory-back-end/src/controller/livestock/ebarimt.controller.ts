import config from "../../config";
import { PERMISSION } from "../../types/user/permission.type";
import { SettlementModel } from "../../models/livestock/settlement.model";
import { SettlementLineModel } from "../../models/livestock/settlement-line.model";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { HerderModel } from "../../models/livestock/herder.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { AdminController } from "../user/admin.controller";
import { RegistrationController } from "./registration.controller";
import { SettlementController } from "./settlement.controller";
import { TContext } from "../../types/global/global.type";
import { errorMessage } from "../../utils";

// eBarimt — PosAPI 3.0 (developer.itc.gov.mn → "Цахим төлбөрийн баримтын
// систем" → POST /rest/receipt). The factory issues the herder's sales
// receipt ON THEIR BEHALF:
//   root.merchantTin / customerTin = factory (issuer and buyer, B2B_RECEIPT)
//   receipts[0].merchantTin         = herder's ТТД (seller — must be
//                                     registered as the factory's түрээслэгч
//                                     in Оператор-ИБаримт)
//   taxType VAT_FREE, taxProductCode = EBARIMT_TAX_PRODUCT_CODE (487)
// so the purchase is a documented, deductible expense for the factory.
// Transport: plain HTTP to the PosAPI service at EBARIMT_POSAPI_URL.
// ponytail: PosAPI must be reachable from this server. If it only lives on
// the factory LAN (like the printers), route this call through the relay.

// БҮНА 7-digit classification (api.ebarimt.mn/api/info/check/barcode/v2):
// 2111 = fresh/chilled meat per animal; kept гэдэс = "Өлөн гэдэс" (2115).
// Keys are matched by prefix against the Animals catalogue name.
const MEAT_CLASS: Record<string, string> = {
  үхэр: "2111100",
  хонь: "2111500",
  ямаа: "2111600",
  тэмээ: "2111700",
  адуу: "2111800",
};
const MEAT_CLASS_OTHER = "2111900"; // Хөхтөн бусад амьтны шинэ мах
const GEDES_CLASS = "2115931"; // Өлөн гэдэс

type TPosItem = {
  name: string;
  barCode: null;
  barCodeType: "UNDEFINED";
  classificationCode: string;
  taxProductCode: string;
  measureUnit: string;
  qty: number;
  unitPrice: number;
  totalVAT: 0;
  totalCityTax: 0;
  totalAmount: number;
};

type TPosResponse = {
  id?: string;
  status?: string;
  message?: string;
  date?: string;
};

const SETTLEMENT_WITH_HERDER = [
  {
    model: SettlementLineModel,
    as: "lines",
    include: [{ model: AnimalModel, as: "animal" }],
  },
  {
    model: RegistrationModel,
    as: "registration",
    include: [{ model: HerderModel, as: "herder" }],
  },
];

const r2 = (n: number) => Number(n.toFixed(2));

export type TEbarimtCfg = {
  merchantTin: string;
  posNo: string;
  branchNo: string;
  districtCode: string;
  taxProductCode: string;
};

export type TEbarimtLine = {
  animal: string;
  receivedWeightKg: number;
  pricePerKg: number;
  meatAmount: number;
  byproductAmount: number;
};

function meatClass(animal: string): string {
  const k = animal.trim().toLowerCase();
  for (const [name, code] of Object.entries(MEAT_CLASS))
    if (k.startsWith(name)) return code;
  return MEAT_CLASS_OTHER;
}

// Pure request builder (checked by ebarimt.check.ts). One receipt per
// settlement: meat per animal (kg × price/kg) plus the kept гэдэс credit per
// animal. Бой зардал is the factory's own service, not the herder's sale, so
// it is not on this receipt.
export function buildReceipt(
  lines: TEbarimtLine[],
  herderTin: string,
  cfg: TEbarimtCfg,
  billIdSuffix: string,
) {
  const items: TPosItem[] = [];
  const base = {
    barCode: null,
    barCodeType: "UNDEFINED",
    taxProductCode: cfg.taxProductCode,
    totalVAT: 0,
    totalCityTax: 0,
  } as const;
  for (const l of lines) {
    if (l.receivedWeightKg > 0 && l.meatAmount > 0)
      items.push({
        ...base,
        name: `${l.animal} мах`,
        classificationCode: meatClass(l.animal),
        measureUnit: "кг",
        qty: r2(l.receivedWeightKg),
        unitPrice: r2(l.pricePerKg),
        totalAmount: r2(l.meatAmount),
      });
    if (l.byproductAmount > 0)
      items.push({
        ...base,
        name: `${l.animal} гэдэс (дайвар)`,
        classificationCode: GEDES_CLASS,
        measureUnit: "ш",
        qty: 1,
        unitPrice: r2(l.byproductAmount),
        totalAmount: r2(l.byproductAmount),
      });
  }
  if (items.length === 0) throw new Error("Баримтад оруулах мөр алга");
  const total = r2(items.reduce((s, i) => s + i.totalAmount, 0));
  return {
    branchNo: cfg.branchNo,
    totalAmount: total,
    totalVAT: 0,
    totalCityTax: 0,
    districtCode: cfg.districtCode,
    merchantTin: cfg.merchantTin,
    posNo: cfg.posNo,
    customerTin: cfg.merchantTin,
    consumerNo: "",
    type: "B2B_RECEIPT",
    inactiveId: null,
    reportMonth: null,
    billIdSuffix,
    receipts: [
      {
        totalAmount: total,
        totalVAT: 0,
        totalCityTax: 0,
        taxType: "VAT_FREE",
        merchantTin: herderTin,
        customerTin: null,
        bankAccountNo: null,
        iBan: null,
        items,
      },
    ],
    payments: [{ code: "BANK_TRANSFER", status: "PAID", paidAmount: total }],
  };
}

export class EbarimtController {
  private static cfg(): TEbarimtCfg & { url: string } {
    const c = {
      url: config.EBARIMT_POSAPI_URL.replace(/\/+$/, ""),
      merchantTin: config.EBARIMT_MERCHANT_TIN,
      posNo: config.EBARIMT_POS_NO,
      branchNo: config.EBARIMT_BRANCH_NO,
      districtCode: config.EBARIMT_DISTRICT_CODE,
      taxProductCode: config.EBARIMT_TAX_PRODUCT_CODE,
    };
    if (!c.url || !c.merchantTin || !c.posNo || !c.districtCode)
      throw new Error(
        "И-Баримт тохиргоо дутуу: EBARIMT_POSAPI_URL, EBARIMT_MERCHANT_TIN, EBARIMT_POS_NO, EBARIMT_DISTRICT_CODE",
      );
    return c;
  }

  // POST / DELETE {url}/rest/receipt. PosAPI answers 200 with
  // status SUCCESS | ERROR | PAYMENT and a message.
  private static async posapi(
    method: "POST" | "DELETE",
    body: unknown,
  ): Promise<TPosResponse> {
    const res = await fetch(`${this.cfg().url}/rest/receipt`, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    }).catch((e: unknown) => {
      throw new Error(`PosAPI холбогдсонгүй: ${errorMessage(e)}`);
    });
    const text = await res.text();
    let json: TPosResponse;
    try {
      json = text ? (JSON.parse(text) as TPosResponse) : {};
    } catch {
      json = { message: text.slice(0, 200) };
    }
    if (!res.ok || (json.status && json.status !== "SUCCESS"))
      throw new Error(json.message || `PosAPI HTTP ${res.status}`);
    return json;
  }

  // Seller ТТД: stored on the herder, else looked up from the register
  // number via the public info service and saved for next time.
  private static async herderTin(h: HerderModel): Promise<string> {
    if (h.tin) return h.tin;
    const missing = new Error(
      `${h.name}: ТТД (татвар төлөгчийн дугаар) бүртгэгдээгүй байна — малчны мэдээлэлд оруулна уу`,
    );
    try {
      const res = await fetch(
        `https://api.ebarimt.mn/api/info/check/getTinInfo?regNo=${encodeURIComponent(h.registrationNo)}`,
        { signal: AbortSignal.timeout(10_000) },
      );
      const json = (await res.json()) as {
        status?: number;
        data?: string | number | null;
      };
      if (json.status !== 200 || !json.data) throw missing;
      const tin = String(json.data);
      await h.update({ tin });
      return tin;
    } catch {
      throw missing;
    }
  }

  private static async load(
    registrationId: string,
    context: TContext,
  ): Promise<SettlementModel> {
    AdminController.assertPermission(context, PERMISSION.SETTLEMENT_PAY);
    await RegistrationController.findIdCheck(registrationId, context);
    const st = await SettlementModel.findOne({
      where: { registrationId },
      include: SETTLEMENT_WITH_HERDER,
    });
    if (!st) throw new Error("Settlement not found");
    return st;
  }

  static async issue(
    registrationId: string,
    context: TContext,
  ): Promise<SettlementModel> {
    const cfg = this.cfg();
    const st = await this.load(registrationId, context);
    if (st.ebarimtId && !st.ebarimtVoidedAt)
      throw new Error(`И-Баримт аль хэдийн үүссэн: ${st.ebarimtId}`);
    const herder = st.registration?.herder;
    if (!herder) throw new Error("Herder not found");
    const tin = await this.herderTin(herder);
    const body = buildReceipt(
      (st.lines ?? []).map((l) => ({
        animal: l.animal?.name ?? "Мал",
        receivedWeightKg: Number(l.receivedWeightKg),
        pricePerKg: Number(l.pricePerKg),
        meatAmount: Number(l.meatAmount),
        byproductAmount: Number(l.byproductAmount),
      })),
      tin,
      cfg,
      // Unique per day on this POS; the ms clock is plenty for our volume.
      String(Date.now()).slice(-6),
    );

    try {
      const r = await this.posapi("POST", body);
      if (!r.id) throw new Error(r.message || "PosAPI ДДТД буцаасангүй");
      await st.update({
        ebarimtId: r.id,
        ebarimtDate: r.date ?? null,
        ebarimtIssuedAt: new Date(),
        ebarimtVoidedAt: null,
        ebarimtError: null,
      });
    } catch (e) {
      await st.update({ ebarimtError: errorMessage(e) });
      throw e;
    }
    return SettlementController.reload(st.id);
  }

  // DELETE /rest/receipt {id, date} — date must be PosAPI's own string.
  static async void(
    registrationId: string,
    context: TContext,
  ): Promise<SettlementModel> {
    const st = await this.load(registrationId, context);
    if (!st.ebarimtId || st.ebarimtVoidedAt)
      throw new Error("Цуцлах И-Баримт алга");
    await this.posapi("DELETE", { id: st.ebarimtId, date: st.ebarimtDate });
    await st.update({ ebarimtVoidedAt: new Date(), ebarimtError: null });
    return SettlementController.reload(st.id);
  }
}
