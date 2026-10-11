// FIFO self-check: npx ts-node src/controller/inventory/costing.check.ts
import assert from "node:assert/strict";
import { runFifo } from "./costing.controller";

// 300 kg bought at 19K, then 700 kg at 18K; a 600 kg shipment leaves.
const { outCost, lots } = runFifo([
  { id: "in1", out: false, kg: 300, unitCost: 19_000 },
  { id: "in2", out: false, kg: 700, unitCost: 18_000 },
  { id: "ship", out: true, kg: 600, unitCost: null },
  // Manual IN with no purchase price → on-hand average (18K here).
  { id: "manual", out: false, kg: 100, unitCost: null },
]);
assert.equal(outCost.get("ship"), 300 * 19_000 + 300 * 18_000); // 11.1M → 18.5K/kg
assert.deepEqual(lots, [
  { kg: 400, unitCost: 18_000 },
  { kg: 100, unitCost: 18_000 },
]);
console.log("FIFO OK");
