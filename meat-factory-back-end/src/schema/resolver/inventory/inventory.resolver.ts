import { InventoryController } from "../../../controller/inventory/inventory.controller";
import {
  TGetMovements,
  TGetStock,
  TManualAdjustInput,
} from "../../../types/inventory/inventory.type";
import { wrapList, wrapOne } from "../../../utils";

export default {
  Query: {
    inventoryStock: wrapList("inventoryItems", (doc: TGetStock) =>
      InventoryController.getStock(doc),
    ),
    inventoryMovements: wrapList("movements", (doc: TGetMovements) =>
      InventoryController.listMovements(doc),
    ),
    inventoryStats: wrapOne("stats", () => InventoryController.stats()),
  },
  Mutation: {
    adjustInventory: wrapOne(
      "inventoryItem",
      (doc: TManualAdjustInput, ctx) =>
        InventoryController.manualAdjust(doc, ctx.id),
      "Inventory adjusted",
    ),
  },
};
