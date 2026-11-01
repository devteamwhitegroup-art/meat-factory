import { InventoryController } from "../../../controller/inventory/inventory.controller";
import { CostingController } from "../../../controller/inventory/costing.controller";
import {
  TGetMovements,
  TGetStock,
  TManualAdjustInput,
} from "../../../types/inventory/inventory.type";
import { InventoryMovementModel } from "../../../models/inventory/inventory-movement.model";
import { InventoryItemModel } from "../../../models/inventory/inventory-item.model";
import { PRODUCT_TYPE } from "../../../types/sales/sales-transaction.type";
import { wrapItems, wrapList, wrapOne } from "../../../utils";

export default {
  // Display SKU ("Мах:Адуу"); the stored sku is the id-based stockKey.
  InventoryItem: {
    sku: (i: InventoryItemModel) =>
      i.productType === PRODUCT_TYPE.MEAT
        ? `Мах:${i.animal?.name ?? ""}`
        : ["Дайвар", i.animal?.name, i.byproductName].filter(Boolean).join(":"),
  },
  // Source links for the movement log (joined in listMovements).
  InventoryMovement: {
    registrationCode: (m: InventoryMovementModel) =>
      m.registration?.registrationCode ?? null,
    shipmentCode: (m: InventoryMovementModel) =>
      m.shipment?.shipmentCode ?? null,
  },
  Query: {
    inventoryValuation: wrapItems(
      "rows",
      ({ factory }: { factory?: string | null }, ctx) =>
        CostingController.valuation(ctx, factory),
    ),
    inventoryStock: wrapList("inventoryItems", (doc: TGetStock, ctx) =>
      InventoryController.getStock(doc, ctx),
    ),
    inventoryMovements: wrapList("movements", (doc: TGetMovements, ctx) =>
      InventoryController.listMovements(doc, ctx),
    ),
    inventoryStats: wrapOne("stats", (doc: { factory?: string }, ctx) =>
      InventoryController.stats(ctx, doc.factory),
    ),
  },
  Mutation: {
    adjustInventory: wrapOne(
      "inventoryItem",
      (doc: TManualAdjustInput, ctx) =>
        InventoryController.manualAdjust(doc, ctx),
      "Inventory adjusted",
    ),
  },
};
