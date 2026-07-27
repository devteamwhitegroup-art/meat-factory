import {
  MOVEMENT_SOURCE,
  MOVEMENT_TYPE
} from '../../../types/inventory/inventory.type';
import { PaginationSchema } from '../global/global.type';

export default `#graphql
    enum MOVEMENT_TYPE {
        ${Object.values(MOVEMENT_TYPE).join('\n ')}
    }

    enum MOVEMENT_SOURCE {
        ${Object.values(MOVEMENT_SOURCE).join('\n ')}
    }

    type InventoryItem {
        id: ID
        sku: String
        productType: PRODUCT_TYPE
        # Animal catalogue FK for MEAT rows. Null for byproducts.
        animalId: ID
        animal: Animal
        # Free-form Mongolian byproduct name (SKU BYPN:<name>).
        byproductName: String
        quantityKg: Float
        createdAt: Date
        updatedAt: Date
    }

    type InventoryMovement {
        id: ID
        inventoryItemId: ID
        item: InventoryItem
        movementType: MOVEMENT_TYPE
        source: MOVEMENT_SOURCE
        quantityKg: Float
        balanceAfterKg: Float
        sourceRegistrationId: ID
        sourceShipmentId: ID
        createdById: ID
        notes: String
        createdAt: Date
        updatedAt: Date
    }

    type InventoryItemResponse {
        success: Boolean
        message: String
        inventoryItem: InventoryItem
    }

    type InventoryItemsResponse {
        success: Boolean
        message: String
        inventoryItems: [InventoryItem]
        count: Int
    }

    type InventoryMovementsResponse {
        success: Boolean
        message: String
        movements: [InventoryMovement]
        count: Int
    }

    # Aggregate stats for the inventory dashboard: current totals + the
    # configured export/domestic thresholds + alert state. Bundled together
    # to keep the page render to a single round-trip.
    type InventoryStats {
        meatStockKg: Float
        byproductStockKg: Float
        meatCapacityKg: Float
        # exportEligibleMeatKg: meat from export-flagged animals (Animal.
        # isExport) — the only meat an EXPORT shipment can load. A subset of
        # meatStockKg, full physical total not reduced by what's already
        # loaded on a truck.
        # domesticAvailableMeatKg: a DOMESTIC shipment accepts any meat, so
        # this always equals meatStockKg (not a separate subset).
        exportEligibleMeatKg: Float
        domesticAvailableMeatKg: Float
        exportAlertThresholdKg: Float
        domesticAlertThresholdKg: Float
        exportAlertActive: Boolean
        domesticAlertActive: Boolean
    }

    type InventoryStatsResponse {
        success: Boolean
        message: String
        stats: InventoryStats
    }

    extend type Query {
        inventoryStock(
            productType: PRODUCT_TYPE
            animalId: ID
            byproductName: String
        ): InventoryItemsResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        inventoryMovements(
            inventoryItemId: ID
            movementType: MOVEMENT_TYPE
            source: MOVEMENT_SOURCE
            dateRange: DateRangeInput
            ${PaginationSchema}
        ): InventoryMovementsResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        inventoryStats: InventoryStatsResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])
    }

    extend type Mutation {
        adjustInventory(
            productType: PRODUCT_TYPE!
            animalId: ID
            byproductName: String
            quantityKg: Float!
            direction: MOVEMENT_TYPE!
            notes: String
        ): InventoryItemResponse @auth(permissions: ["MANAGER", "SUPER_ADMIN", "STOREKEEPER" ])
    }
`;
