import { InventoryController } from "../../../controller/inventory/inventory.controller";
import { CostingController } from "../../../controller/inventory/costing.controller";
import {
  TGetMovements,
  TGetStock,
  TManualAdjustInput,
} from "../../../types/inventory/inventory.type";
import { InventoryMovementModel } from "../../../models/inventory/inventory-movement.model";
import { RegistrationModel } from "../../../models/livestock/registration.model";
import { ShipmentModel } from "../../../models/shipment/shipment.model";
import { wrapItems, wrapList, wrapOne } from "../../../utils";

export default {
  // Source codes for the movement log's links (one page = ≤50 lookups).
  InventoryMovement: {
    registrationCode: async (m: InventoryMovementModel) =>
      m.sourceRegistrationId
        ? ((
            await RegistrationModel.findByPk(m.sourceRegistrationId, {
              attributes: ["registrationCode"],
            })
          )?.registrationCode ?? null)
        : null,
    shipmentCode: async (m: InventoryMovementModel) =>
      m.sourceShipmentId
        ? ((
            await ShipmentModel.findByPk(m.sourceShipmentId, {
              attributes: ["shipmentCode"],
            })
          )?.shipmentCode ?? null)
        : null,
  },
  Query: {
    inventoryValuation: wrapItems(
      "rows",
      ({ factory }: { factory?: string | null }) =>
        CostingController.valuation(factory),
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
