import { InventoryItemModel } from "../../models/inventory/inventory-item.model";
import { InventoryMovementModel } from "../../models/inventory/inventory-movement.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { ShipmentSaleLineModel } from "../../models/shipment/shipment-sale-line.model";
import { ShipmentSaleEntryModel } from "../../models/shipment/shipment-sale-entry.model";
import { ShipmentController } from "../shipment/shipment.controller";
import {
  MOVEMENT_SOURCE,
  MOVEMENT_TYPE,
} from "../../types/inventory/inventory.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { SHIPMENT_STATUS } from "../../types/shipment/shipment.type";

type Lot = { kg: number; unitCost: number };

// One ledger row for the FIFO run: OUT, or IN at a known unit cost (null =
// no purchase price → costed at the on-hand average).
export type FifoMove = {
  id: string;
  out: boolean;
  kg: number;
  unitCost: number | null;
};

// Pure first-in-first-out over a SKU's ledger (oldest first): the cost each
// OUT took, and the lots left on hand. Check: costing.check.ts.
export function runFifo(moves: FifoMove[]): {
  outCost: Map<string, number>;
  lots: Lot[];
} {
  const lots: Lot[] = [];
  const outCost = new Map<string, number>();
  const onHandAvg = () => {
    const kg = lots.reduce((s, l) => s + l.kg, 0);
    return kg > 0 ? lots.reduce((s, l) => s + l.kg * l.unitCost, 0) / kg : 0;
  };
  for (const m of moves) {
    if (!(m.kg > 0)) continue;
    if (m.out) {
      let left = m.kg;
      let cost = 0;
      while (left > 1e-9 && lots.length > 0) {
        const lot = lots[0];
        const take = Math.min(lot.kg, left);
        cost += take * lot.unitCost;
        lot.kg -= take;
        left -= take;
        if (lot.kg <= 1e-9) lots.shift();
      }
      outCost.set(m.id, cost);
    } else {
      lots.push({ kg: m.kg, unitCost: m.unitCost ?? onHandAvg() });
    }
  }
  return { outCost, lots };
}

const round2 = (n: number) => Number(n.toFixed(2));
const perKg = (amount: number, kg: number) =>
  kg > 0 ? round2(amount / kg) : null;

// Meat cost, first-in-first-out. Every stock IN of a meat SKU is a lot
// costed at what the herder was paid for that animal on that registration
// (Σ weighed kg × price) ÷ the kg that entered stock — so the yield
// haircut (horse 70%) is priced in. Manual IN has no purchase price: it is
// costed at the average of what's on hand. OUT (shipments, manual) takes the
// oldest lots first, so the cost of what remains shifts as lots run out.
// ponytail: recomputed by replaying the SKU's ledger on each read (no lot
// table, works on existing data); materialise lots if ledgers get long.
export class CostingController {
  private static async _replay(
    item: InventoryItemModel,
  ): Promise<{ outCost: Map<string, number>; lots: Lot[] }> {
    const moves = await InventoryMovementModel.findAll({
      where: { inventoryItemId: item.id },
      order: [
        ["createdAt", "ASC"],
        ["id", "ASC"],
      ],
    });

    // Herder payment for this animal per source registration.
    const regIds = [
      ...new Set(
        moves
          .filter((m) => m.movementType !== MOVEMENT_TYPE.OUT)
          .map((m) => m.sourceRegistrationId)
          .filter((id): id is string => !!id),
      ),
    ];
    const paid = new Map<string, number>();
    if (regIds.length > 0 && item.animalId) {
      const weighings = await WeighingEntryModel.findAll({
        where: { registrationId: regIds, animalId: item.animalId },
      });
      for (const w of weighings)
        paid.set(
          w.registrationId,
          (paid.get(w.registrationId) ?? 0) +
            Number(w.weightKg) * Number(w.pricePerKg ?? 0),
        );
    }

    return runFifo(
      moves.map((m) => {
        const kg = Number(m.quantityKg);
        const p = m.sourceRegistrationId
          ? paid.get(m.sourceRegistrationId)
          : undefined;
        return {
          id: m.id,
          out: m.movementType === MOVEMENT_TYPE.OUT,
          kg,
          unitCost: p != null && kg > 0 ? p / kg : null,
        };
      }),
    );
  }

  // Admin: per meat type — kg loaded vs FIFO cost, kg sold vs reported
  // income. Cost is known once DELIVERED (that's when stock goes OUT).
  static async shipmentAnalytics(shipmentId: string) {
    const shipment = await ShipmentController.findIdCheck(shipmentId);
    const costKnown = shipment.status === SHIPMENT_STATUS.DELIVERED;

    const costByAnimal = new Map<string, number>();
    if (costKnown) {
      const outs = await InventoryMovementModel.findAll({
        where: {
          source: MOVEMENT_SOURCE.SHIPMENT,
          sourceShipmentId: shipmentId,
          movementType: MOVEMENT_TYPE.OUT,
        },
        include: [
          {
            model: InventoryItemModel,
            as: "item",
            where: { productType: PRODUCT_TYPE.MEAT },
            include: [{ model: AnimalModel, as: "animal" }],
          },
        ],
      });
      for (const m of outs) {
        const { outCost } = await this._replay(m.item!);
        const name = m.item?.animal?.name ?? "";
        costByAnimal.set(
          name,
          (costByAnimal.get(name) ?? 0) + (outCost.get(m.id) ?? 0),
        );
      }
    }

    const saleLines = await ShipmentSaleLineModel.findAll({
      where: { shipmentId, productType: PRODUCT_TYPE.MEAT },
      include: [{ model: ShipmentSaleEntryModel, as: "entries" }],
    });
    const lines = saleLines.map((l) => {
      const entries = l.entries ?? [];
      const shippedKg = Number(l.totalWeightKg);
      const soldKg = entries.reduce((s, e) => s + Number(e.weightKg), 0);
      const income = entries.reduce(
        (s, e) => s + Number(e.weightKg) * Number(e.pricePerKg),
        0,
      );
      const cost = costKnown ? (costByAnimal.get(l.animalType ?? "") ?? 0) : 0;
      return {
        animalType: l.animalType,
        shippedKg: round2(shippedKg),
        cost: costKnown ? round2(cost) : null,
        avgCostPerKg: costKnown ? perKg(cost, shippedKg) : null,
        soldKg: round2(soldKg),
        income: round2(income),
        avgIncomePerKg: perKg(income, soldKg),
      };
    });
    const sum = (k: "shippedKg" | "soldKg" | "income" | "cost") =>
      lines.reduce((s, l) => s + (l[k] ?? 0), 0);
    const cost = sum("cost");
    const income = sum("income");
    return {
      costKnown,
      lines,
      shippedKg: round2(sum("shippedKg")),
      cost: costKnown ? round2(cost) : null,
      avgCostPerKg: costKnown ? perKg(cost, sum("shippedKg")) : null,
      soldKg: round2(sum("soldKg")),
      income: round2(income),
      avgIncomePerKg: perKg(income, sum("soldKg")),
      profit: costKnown ? round2(income - cost) : null,
    };
  }

  // Admin: what the meat on hand cost (remaining FIFO lots), per factory and
  // animal type.
  static async valuation(factory?: string | null) {
    const items = await InventoryItemModel.findAll({
      where: {
        productType: PRODUCT_TYPE.MEAT,
        ...(factory ? { factory } : {}),
      },
      include: [{ model: AnimalModel, as: "animal" }],
      order: [["sku", "ASC"]],
    });
    const rows = [];
    for (const item of items) {
      const { lots } = await this._replay(item);
      const kg = lots.reduce((s, l) => s + l.kg, 0);
      if (kg <= 1e-9) continue;
      const value = lots.reduce((s, l) => s + l.kg * l.unitCost, 0);
      rows.push({
        factory: item.factory,
        animalType: item.animal?.name ?? null,
        kg: round2(kg),
        value: round2(value),
        avgCostPerKg: perKg(value, kg),
      });
    }
    return rows;
  }
}
