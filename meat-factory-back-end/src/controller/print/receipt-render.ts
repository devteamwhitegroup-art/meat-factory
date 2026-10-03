import config from "../../config";
import { Escpos } from "../../utils/escpos";
import {
  decodeImage,
  receiptPng,
  receiptRaster,
  RECEIPT_COLS,
  type RLine,
} from "../../utils/receipt-canvas";
import { PRINT_JOB_TYPE } from "../../types/print/print.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { SalesTransactionController } from "../sales/sales-transaction.controller";
import { ShipmentController } from "../shipment/shipment.controller";
import { SettlementModel } from "../../models/livestock/settlement.model";
import { SettlementLineModel } from "../../models/livestock/settlement-line.model";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { HerderModel } from "../../models/livestock/herder.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { AdminModel } from "../../models/user/admin.model";
import { FileModel } from "../../models/global/file.model";

// ---- formatting -----------------------------------------------------------
// Sequelize returns DECIMAL as string — Number() everything before math/format.
const mnt = (v: number | string | null | undefined): string =>
  `${Number(v ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}.-`;

const kg = (v: number | string | null | undefined): string =>
  `${Number(v ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kg`;

// YYYY-MM-DD HH:mm in Mongolia time (UTC+8), independent of server tz.
const dt = (d: Date | string | null | undefined): string => {
  const t = new Date(new Date(d ?? Date.now()).getTime() + 8 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(
    t.getUTCDate(),
  )} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`;
};

// ---- line helpers -------------------------------------------------------------
const RULE: RLine = { rule: true };
const L = (text = ""): RLine => ({ text });
const B = (text: string): RLine => ({ text, bold: true });

const heading = (subtitle: string): RLine[] => [
  { text: config.RECEIPT_HEADER, align: "center", bold: true, scale: 2 },
  { text: subtitle, align: "center" },
  RULE,
];

const foot = (): RLine[] => [RULE, { text: "Баярлалаа", align: "center" }];

// "label ................ value" on one line (value right-aligned by padding).
function row(label: string, value: string): RLine {
  const cols = RECEIPT_COLS;
  const room = cols - value.length;
  const left =
    label.length > room ? label.slice(0, Math.max(0, room - 1)) : label;
  const pad = Math.max(1, cols - left.length - value.length);
  return { text: left + " ".repeat(pad) + value };
}

// Distinct scale operators across a registration's weighing entries — shown
// once in the header (not repeated per row).
function weighers(entries: WeighingEntryModel[]): string {
  const names = [
    ...new Set(entries.map((e) => e.scaleOperator?.param).filter(Boolean)),
  ];
  return names.length ? names.join(", ") : "-";
}

// Signature line: the drawn PNG stored on the server when present, otherwise a
// blank line to sign by hand. Fetched from the file's public URL; any failure
// falls back to the blank line so it never breaks the receipt.
async function signatureBlock(
  label: string,
  file: FileModel | null | undefined,
): Promise<RLine[]> {
  const head: RLine[] = [{ gap: 12 }, L(`${label}:`)];
  if (file?.url) {
    try {
      const res = await fetch(file.url);
      if (res.ok) {
        const img = await decodeImage(Buffer.from(await res.arrayBuffer()));
        return [...head, { gap: 4 }, { img, imgH: 96 }];
      }
    } catch {
      /* fall through to the blank line */
    }
  }
  return [...head, { gap: 24 }, L("________________________________")];
}

// Per-entry weighing log, grouped by animal type, numbered per type. Shared by
// the weigh slip and the settlement receipt.
function weighingLog(entries: WeighingEntryModel[]): RLine[] {
  if (!entries.length) return [];
  const sorted = [...entries].sort((a, b) => a.sequenceNo - b.sequenceNo);
  const groups = new Map<string, WeighingEntryModel[]>();
  for (const e of sorted) {
    const t = e.animal?.name ?? "-";
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t)!.push(e);
  }
  const out: RLine[] = [RULE, L("ЖИНЛЭЛТИЙН ТҮҮХ")];
  for (const [t, rows] of groups) {
    out.push(B(t));
    rows.forEach((e, i) => {
      const w = Number(e.weightKg ?? 0);
      const p = Number(e.pricePerKg ?? 0);
      out.push(row(`${i + 1}. ${kg(w)} x ${p > 0 ? mnt(p) : "-"}`, mnt(w * p)));
    });
  }
  return out;
}

// ---- per-document line builders --------------------------------------------
async function salesLines(id: string): Promise<RLine[]> {
  const tx = await SalesTransactionController.getById(id);
  const out: RLine[] = [
    ...heading("БОРЛУУЛАЛТЫН БАРИМТ"),
    row("Баримт:", tx.transactionCode),
    row("Огноо:", dt(tx.transactionDate)),
    row("Харилцагч:", tx.customer?.name ?? "-"),
  ];

  const items = tx.lineItems ?? [];
  if (items.length > 0) {
    out.push(RULE);
    for (const li of items) {
      const name =
        li.productType === PRODUCT_TYPE.MEAT
          ? (li.animalType ?? "Мах")
          : (li.byproductName ?? "Дайвар");
      out.push(L(name));
      const unit = li.unitPrice == null ? "-" : mnt(li.unitPrice);
      const amount = li.lineAmount == null ? "-" : mnt(li.lineAmount);
      out.push(row(`  ${kg(li.quantityKg)} x ${unit}`, amount));
    }
  }

  out.push(
    RULE,
    row("НИЙТ ЖИН", kg(tx.totalWeightKg)),
    {
      ...row("НИЙТ ДҮН", tx.amount == null ? "-" : mnt(tx.amount)),
      bold: true,
    },
    row("Төлбөр:", tx.paymentStatus),
  );

  const paid = (tx.installments ?? []).reduce(
    (s, i) => s + Number(i.amountMnt ?? 0),
    0,
  );
  if (paid > 0) {
    out.push(
      row("Төлсөн:", mnt(paid)),
      row("Үлдэгдэл:", mnt(Number(tx.amount ?? 0) - paid)),
    );
  }
  return [...out, ...foot()];
}

async function shipmentLines(id: string): Promise<RLine[]> {
  const s = await ShipmentController.getById(id);
  const out: RLine[] = [
    ...heading("АЧИЛТЫН ХУУДАС"),
    row("Код:", s.shipmentCode),
    row("Огноо:", dt(s.shippedAt ?? s.createdAt)),
    row(
      "Төрөл:",
      `${s.category}${s.domesticMarket ? " / " + s.domesticMarket : ""}`,
    ),
    row("Харилцагч:", s.customer?.name ?? "-"),
    row("Машин:", s.vehiclePlate ?? "-"),
    row(
      "Жолооч:",
      [s.driverName, s.driverPhone].filter(Boolean).join(" ") || "-",
    ),
    row("Лац:", s.sealNumber ?? "-"),
    RULE,
  ];

  const cargo = [...(s.cargoEntries ?? [])].sort(
    (a, c) => a.sequenceNo - c.sequenceNo,
  );
  for (const c of cargo) {
    out.push(L(`${c.sequenceNo}. ${c.productLabel}`));
    const pcs = c.pieceCount ? `${c.pieceCount} ш   ` : "";
    out.push(row(`  ${pcs}`, kg(c.weightKg)));
  }

  out.push(RULE, { ...row("НИЙТ ЖИН", kg(s.weightKg)), bold: true });
  if (s.totalPrice != null) out.push(row("НИЙТ ДҮН", mnt(s.totalPrice)));
  out.push(row("Төлөв:", s.status));
  return [...out, ...foot()];
}

async function settlementLines(id: string): Promise<RLine[]> {
  const st = await SettlementModel.findByPk(id, {
    include: [
      { model: FileModel, as: "storekeeperSignature" },
      {
        model: SettlementLineModel,
        as: "lines",
        include: [{ model: AnimalModel, as: "animal" }],
      },
      {
        model: RegistrationModel,
        as: "registration",
        include: [
          { model: HerderModel, as: "herder" },
          { model: FileModel, as: "agreementSignature" },
          {
            model: WeighingEntryModel,
            as: "weighingEntries",
            include: [
              { model: AnimalModel, as: "animal" },
              { model: AdminModel, as: "scaleOperator" },
            ],
          },
        ],
      },
    ],
  });
  if (!st) throw new Error("Settlement not found");

  const out: RLine[] = [
    ...heading("ТООЦООНЫ БАРИМТ"),
    row("Бүртгэл:", st.registration?.registrationCode ?? "-"),
    row("Огноо:", dt(st.paidAt ?? st.createdAt)),
    row("Малчин:", st.registration?.herder?.name ?? "-"),
    row("Жинлэсэн:", weighers(st.registration?.weighingEntries ?? [])),
    RULE,
  ];

  for (const l of st.lines ?? []) {
    out.push(L(l.animal?.name ?? "Мал"));
    out.push(
      row(
        `  ${kg(l.receivedWeightKg)} x ${mnt(l.pricePerKg)}`,
        mnt(l.meatAmount),
      ),
    );
    if (Number(l.slaughterCost ?? 0) > 0)
      out.push(row("  Бойны зардал", `-${mnt(l.slaughterCost)}`));
  }

  out.push(
    RULE,
    row("НИЙЛБЭР ДҮН", mnt(st.grossAmount)),
    row("БОЙНЫ ЗАРДАЛ", `-${mnt(st.totalSlaughterCost)}`),
    { ...row("ЦЭВЭР ОЛГОХ", mnt(st.netPayable)), bold: true },
    row("Олгосон", mnt(st.paidAmount)),
  );
  if (Number(st.heldAmount ?? 0) > 0)
    out.push(row("Хойшлуулсан", mnt(st.heldAmount)));
  out.push(row("Төлөв:", st.isPaid ? "ТӨЛСӨН" : "ХҮЛЭЭГДЭЖ БУЙ"));
  out.push(...weighingLog(st.registration?.weighingEntries ?? []));
  out.push(RULE);
  out.push(
    ...(await signatureBlock(
      "Малчны гарын үсэг",
      st.registration?.agreementSignature,
    )),
  );
  out.push(...(await signatureBlock("Няравын гарын үсэг", st.storekeeperSignature)));
  return [...out, ...foot()];
}

// Pre-settlement weighed / price slip. refId = Registration id. Meat per type =
// Σ(weightKg × pricePerKg); бой per type = Σ(slaughter cost). The verifier's
// byproduct-cover offset is applied at settlement time and is NOT shown here.
async function weighSlipLines(id: string): Promise<RLine[]> {
  const reg = await RegistrationModel.findByPk(id, {
    include: [
      { model: HerderModel, as: "herder" },
      { model: FileModel, as: "agreementSignature" },
      {
        model: RegistrationAnimalLineModel,
        as: "animalLines",
        include: [{ model: AnimalModel, as: "animal" }],
      },
      {
        model: WeighingEntryModel,
        as: "weighingEntries",
        include: [
          { model: AnimalModel, as: "animal" },
          { model: AdminModel, as: "scaleOperator" },
        ],
      },
    ],
  });
  if (!reg) throw new Error("Registration not found");

  const meat: Record<string, { weight: number; amount: number }> = {};
  for (const e of reg.weighingEntries ?? []) {
    const t = e.animal?.name ?? "-";
    const w = Number(e.weightKg ?? 0);
    const p = Number(e.pricePerKg ?? 0);
    if (!meat[t]) meat[t] = { weight: 0, amount: 0 };
    meat[t].weight += w;
    meat[t].amount += w * p;
  }
  const boy: Record<string, number> = {};
  for (const l of reg.animalLines ?? []) {
    const t = l.animal?.name ?? "-";
    boy[t] = (boy[t] ?? 0) + Number(l.slaughterCost ?? 0);
  }

  const out: RLine[] = [
    ...heading("ЖИНЛЭЛТ / ҮНИЙН ХУУДАС"),
    row("Бүртгэл:", reg.registrationCode ?? "-"),
    row("Огноо:", dt(reg.intakeDate)),
    row("Малчин:", reg.herder?.name ?? "-"),
    row("Машин:", reg.vehicleNumber ?? "-"),
    row("Жинлэсэн:", weighers(reg.weighingEntries ?? [])),
    RULE,
  ];

  let gross = 0;
  let totalBoy = 0;
  for (const t of new Set([...Object.keys(meat), ...Object.keys(boy)])) {
    const w = meat[t]?.weight ?? 0;
    const m = meat[t]?.amount ?? 0;
    const cost = boy[t] ?? 0;
    gross += m;
    totalBoy += cost;
    out.push(L(t));
    out.push(row(`  ${kg(w)} x ${mnt(w > 0 ? m / w : 0)}`, mnt(m)));
    if (cost > 0) out.push(row("  Бойны зардал", `-${mnt(cost)}`));
  }

  out.push(
    RULE,
    row("НИЙТ МАХ", mnt(gross)),
    row("БОЙ ЗАРДАЛ", `-${mnt(totalBoy)}`),
    { ...row("ЦЭВЭР ОЛГОХ", mnt(gross - totalBoy)), bold: true },
  );
  out.push(...weighingLog(reg.weighingEntries ?? []));
  out.push(RULE);
  out.push(...(await signatureBlock("Малчны гарын үсэг", reg.agreementSignature)));
  return out;
}

// ---- entry points ----------------------------------------------------------
function lines(type: PRINT_JOB_TYPE, refId: string): Promise<RLine[]> {
  switch (type) {
    case PRINT_JOB_TYPE.SALES_RECEIPT:
      return salesLines(refId);
    case PRINT_JOB_TYPE.SHIPMENT_SLIP:
      return shipmentLines(refId);
    case PRINT_JOB_TYPE.SETTLEMENT_RECEIPT:
      return settlementLines(refId);
    case PRINT_JOB_TYPE.WEIGH_SLIP:
      return weighSlipLines(refId);
    default:
      throw new Error(`Cannot render print type ${type}`);
  }
}

// ESC/POS bytes: init + raster image + feed + cut.
export async function renderReceipt(
  type: PRINT_JOB_TYPE,
  refId: string,
): Promise<Buffer> {
  const r = receiptRaster(await lines(type, refId));
  return new Escpos()
    .init()
    .raster(r.widthBytes, r.height, r.data)
    .feed(3)
    .cut()
    .done();
}

// PNG data URL for the on-screen preview.
export async function renderReceiptPreview(
  type: PRINT_JOB_TYPE,
  refId: string,
): Promise<string> {
  const png = receiptPng(await lines(type, refId));
  return `data:image/png;base64,${png.toString("base64")}`;
}

// Standalone printer test slip (no source record) — exercises the full
// pipeline and shows Cyrillic + Mongolian Ө Ү + Latin render correctly.
export function renderPrinterTest(): { bytes: Buffer; preview: string } {
  const test: RLine[] = [
    { text: config.RECEIPT_HEADER, align: "center", bold: true, scale: 2 },
    { text: "ПРИНТЕР ТЕСТ", align: "center" },
    RULE,
    L("Кирилл: АБВГДЕ ЁЖЗ абвгдеёж"),
    L("Монгол: Өө Үү өнөөдөр үнэ"),
    L("Latin : ABCDEFG abcdefg"),
    L("Тоо   : 0123456789  1,234,567.-"),
    B("Bold  : Тод бичвэр / bold text"),
    RULE,
    { text: dt(new Date()), align: "center" },
  ];
  const r = receiptRaster(test);
  return {
    bytes: new Escpos()
      .init()
      .raster(r.widthBytes, r.height, r.data)
      .feed(3)
      .cut()
      .done(),
    preview: `data:image/png;base64,${receiptPng(test).toString("base64")}`,
  };
}
