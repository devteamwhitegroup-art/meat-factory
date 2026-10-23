// eBarimt request self-check: npx ts-node src/controller/livestock/ebarimt.check.ts
import assert from "node:assert/strict";
import { buildReceipt } from "./ebarimt.controller";

const cfg = {
  merchantTin: "11111111111",
  posNo: "001",
  branchNo: "001",
  districtCode: "2501",
  taxProductCode: "487",
};
const line = (
  animal: string,
  kg: number,
  price: number,
  meat: number,
  gedes: number,
) => ({
  animal,
  receivedWeightKg: kg,
  pricePerKg: price,
  meatAmount: meat,
  byproductAmount: gedes,
});

// 250 kg beef at 12,000 + 40 kg sheep at 9,500 with 30,000 of kept гэдэс.
const r = buildReceipt(
  [line("Үхэр", 250, 12_000, 3_000_000, 0), line("Хонь", 40, 9_500, 380_000, 30_000)],
  "22222222222222",
  cfg,
  "123456",
);

// Factory issues and buys (B2B); the herder is the sub-receipt seller.
assert.equal(r.type, "B2B_RECEIPT");
assert.equal(r.merchantTin, cfg.merchantTin);
assert.equal(r.customerTin, cfg.merchantTin);
assert.equal(r.receipts.length, 1);
assert.equal(r.receipts[0].merchantTin, "22222222222222");
// VAT-free herder meat: every item carries the 487 code with zero VAT.
assert.equal(r.receipts[0].taxType, "VAT_FREE");
assert.equal(r.totalVAT, 0);
assert.ok(
  r.receipts[0].items.every((i) => i.taxProductCode === "487" && i.totalVAT === 0),
);
// Items: beef, sheep meat, sheep гэдэс — with their БҮНА classes.
assert.deepEqual(
  r.receipts[0].items.map((i) => [
    i.name,
    i.classificationCode,
    i.measureUnit,
    i.qty,
    i.totalAmount,
  ]),
  [
    ["Үхэр мах", "2111100", "кг", 250, 3_000_000],
    ["Хонь мах", "2111500", "кг", 40, 380_000],
    ["Хонь гэдэс (дайвар)", "2115931", "ш", 1, 30_000],
  ],
);
// Totals tie out at every level and are marked fully paid.
assert.equal(r.totalAmount, 3_410_000);
assert.equal(r.receipts[0].totalAmount, 3_410_000);
assert.deepEqual(r.payments, [
  { code: "BANK_TRANSFER", status: "PAID", paidAmount: 3_410_000 },
]);
// Unknown animal → "other mammal meat"; nothing sellable → throws.
assert.equal(
  buildReceipt([line("Сарлаг", 1, 1, 1, 0)], "2", cfg, "1").receipts[0].items[0]
    .classificationCode,
  "2111900",
);
assert.throws(() => buildReceipt([line("Үхэр", 0, 0, 0, 0)], "2", cfg, "1"));
console.log("EBARIMT OK");
