import { InventoryController } from "../../../controller/inventory/inventory.controller";
import {
  TGetMovements,
  TGetStock,
  TManualAdjustInput,
} from "../../../types/inventory/inventory.type";
import { FACTORY } from "../../../types/user/admin.type";
import { wrapList, wrapOne } from "../../../utils";

export default {
  Query: {
    inventoryStock: wrapList("inventoryItems", (doc: TGetStock, ctx) =>
      InventoryController.getStock(doc, ctx),
    ),
    inventoryMovements: wrapList("movements", (doc: TGetMovements, ctx) =>
      InventoryController.listMovements(doc, ctx),
    ),
    inventoryStats: wrapOne("stats", (doc: { factory?: FACTORY }, ctx) =>
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
