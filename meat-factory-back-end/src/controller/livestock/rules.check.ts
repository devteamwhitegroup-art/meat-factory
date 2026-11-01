// Business-rule self-check (no DB): npx ts-node src/controller/livestock/rules.check.ts
import assert from "node:assert/strict";
import { round2 } from "../../utils";
import { stockKey } from "../inventory/inventory.controller";
import { saleTotals } from "../shipment/shipment.controller";
import { RegistrationController } from "./registration.controller";
import { FactoryController } from "../factory/factory.controller";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { FACTORY_KIND } from "../../types/factory/factory.type";
import { REGISTRATION_STATUS as S } from "../../types/livestock/registration.type";
import { PERMISSION as P } from "../../types/user/permission.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { TContext } from "../../types/global/global.type";

// Money rounding: half-up, no binary-float surprises.
assert.equal(round2(1.005), 1.01);
assert.equal(round2(0.1 + 0.2), 0.3);

// One stock identity, by id — a rename can't split stock.
assert.equal(stockKey({ productType: PRODUCT_TYPE.MEAT, animalId: "a1" }), "MEAT:a1");
assert.equal(
  stockKey({ productType: PRODUCT_TYPE.BYPRODUCT, animalId: "a1", byproductName: " Зүрх " }),
  "BYPN:a1:Зүрх",
);
assert.equal(stockKey({ productType: PRODUCT_TYPE.BYPRODUCT, byproductName: "Зүрх" }), "BYPN:Зүрх");
assert.throws(() => stockKey({ productType: PRODUCT_TYPE.MEAT }));

// Sales report: Σ kg, Σ kg × price, average price; nothing reported → null.
assert.deepEqual(
  saleTotals([
    { weightKg: "100", pricePerKg: "18000" },
    { weightKg: 50.5, pricePerKg: 19000 },
  ]),
  { soldKg: 150.5, amount: 2_759_500, pricePerKg: 18335.55 },
);
assert.deepEqual(saleTotals([]), { soldKg: 0, amount: null, pricePerKg: null });

// Registration actions — what the FE's `can` flags and the mutations share.
Reflect.set(
  FactoryController,
  "_cache",
  new Map([
    ["LIVE", { code: "LIVE", kind: FACTORY_KIND.LIVE_SLAUGHTER, isActive: true }],
    ["PRE", { code: "PRE", kind: FACTORY_KIND.PRE_BUTCHERED, isActive: true }],
  ]),
);
const ctx = (...permissions: P[]): TContext => ({
  id: "u",
  permissions,
  crossFactory: true,
  factory: null,
});
const reg = (factory: string, status: S, medicalNumberApproved = false) =>
  ({ factory, status, medicalNumberApproved }) as RegistrationModel;
const can = (r: RegistrationModel, c: TContext, a: Parameters<typeof RegistrationController.blocker>[2]) =>
  RegistrationController.blocker(r, c, a) === null;

// Live settles after verify; pre-butchered straight from WEIGHED.
assert.ok(can(reg("LIVE", S.VERIFIED), ctx(P.SETTLEMENT_CREATE), "createSettlement"));
assert.ok(!can(reg("LIVE", S.WEIGHED), ctx(P.SETTLEMENT_CREATE), "createSettlement"));
assert.ok(can(reg("PRE", S.WEIGHED), ctx(P.SETTLEMENT_CREATE), "createSettlement"));
assert.ok(!can(reg("PRE", S.WEIGHED), ctx(P.REGISTRATION_VERIFY), "verify"));
// Weighing: open while REGISTERED, a privileged fix until paid, then frozen.
assert.ok(can(reg("LIVE", S.REGISTERED), ctx(P.REGISTRATION_WEIGH), "weigh"));
assert.ok(!can(reg("LIVE", S.PAYMENT_PENDING), ctx(P.REGISTRATION_WEIGH), "weigh"));
assert.ok(can(reg("LIVE", S.PAYMENT_PENDING), ctx(P.REGISTRATION_WEIGH_FIX), "weigh"));
assert.ok(!can(reg("LIVE", S.PARTIALLY_SETTLED), ctx(P.REGISTRATION_WEIGH_FIX), "weigh"));
// The held payout is released only once the medical number is approved.
assert.ok(!can(reg("LIVE", S.PARTIALLY_SETTLED), ctx(P.SETTLEMENT_PAY), "releaseHold"));
assert.ok(can(reg("LIVE", S.PARTIALLY_SETTLED, true), ctx(P.SETTLEMENT_PAY), "releaseHold"));
// гэдэс: live counts after weighing, pre-butchered with the intake.
assert.ok(can(reg("LIVE", S.VERIFIED), ctx(P.REGISTRATION_WEIGH), "editByproducts"));
assert.ok(can(reg("PRE", S.REGISTERED), ctx(P.REGISTRATION_WEIGH), "editByproducts"));
assert.ok(!can(reg("PRE", S.WEIGHED), ctx(P.REGISTRATION_WEIGH), "editByproducts"));

console.log("rules OK");
