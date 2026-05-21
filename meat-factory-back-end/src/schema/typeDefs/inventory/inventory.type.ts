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
        animalType: ANIMAL_TYPE
        byproductType: BYPRODUCT_TYPE
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

    extend type Query {
        inventoryStock(
            productType: PRODUCT_TYPE
            animalType: ANIMAL_TYPE
            byproductType: BYPRODUCT_TYPE
        ): InventoryItemsResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        inventoryMovements(
            inventoryItemId: ID
            movementType: MOVEMENT_TYPE
            source: MOVEMENT_SOURCE
            dateRange: DateRangeInput
            ${PaginationSchema}
        ): InventoryMovementsResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])
    }

    extend type Mutation {
        adjustInventory(
            productType: PRODUCT_TYPE!
            animalType: ANIMAL_TYPE
            byproductType: BYPRODUCT_TYPE
            quantityKg: Float!
            direction: MOVEMENT_TYPE!
            notes: String
        ): InventoryItemResponse @auth(permissions: ["MANAGER", "SUPER_ADMIN"])
    }
`;
