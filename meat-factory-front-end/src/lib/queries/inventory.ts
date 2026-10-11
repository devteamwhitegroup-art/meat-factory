import { graphql } from "@/lib/gql/gql";

export const InventoryStockDoc = graphql(/* GraphQL */ `
  query InventoryStock(
    $factory: String
    $productType: PRODUCT_TYPE
    $animalId: ID
    $byproductName: String
  ) {
    inventoryStock(
      factory: $factory
      productType: $productType
      animalId: $animalId
      byproductName: $byproductName
    ) {
      success
      message
      count
      inventoryItems {
        id
        factory
        sku
        productType
        animalId
        animal {
          id
          name
          isExport
        }
        byproductName
        quantityKg
        quantityCount
        updatedAt
      }
    }
  }
`);

export const InventoryMovementsDoc = graphql(/* GraphQL */ `
  query InventoryMovements(
    $factory: String
    $productType: PRODUCT_TYPE
    $inventoryItemId: ID
    $movementType: MOVEMENT_TYPE
    $source: MOVEMENT_SOURCE
    $dateRange: DateRangeInput
    $limit: Int
    $page: Int
  ) {
    inventoryMovements(
      factory: $factory
      productType: $productType
      inventoryItemId: $inventoryItemId
      movementType: $movementType
      source: $source
      dateRange: $dateRange
      limit: $limit
      page: $page
    ) {
      success
      message
      count
      movements {
        id
        movementType
        source
        quantityKg
        balanceAfterKg
        quantityCount
        balanceAfterCount
        createdAt
        notes
        sourceRegistrationId
        sourceShipmentId
        registrationCode
        shipmentCode
        item {
          id
          factory
          sku
          productType
          byproductName
          animal {
            id
            name
          }
        }
      }
    }
  }
`);

export const InventoryStatsDoc = graphql(/* GraphQL */ `
  query InventoryStats($factory: String) {
    inventoryStats(factory: $factory) {
      success
      message
      stats {
        meatStockKg
        byproductStockKg
        meatCapacityKg
        exportEligibleMeatKg
        domesticAvailableMeatKg
        exportAlertThresholdKg
        domesticAlertThresholdKg
        exportAlertActive
        domesticAlertActive
      }
    }
  }
`);

export const AdjustInventoryDoc = graphql(/* GraphQL */ `
  mutation AdjustInventory(
    $factory: String
    $productType: PRODUCT_TYPE!
    $animalId: ID
    $byproductName: String
    $quantityKg: Float
    $quantityCount: Int
    $direction: MOVEMENT_TYPE!
    $notes: String
  ) {
    adjustInventory(
      factory: $factory
      productType: $productType
      animalId: $animalId
      byproductName: $byproductName
      quantityKg: $quantityKg
      quantityCount: $quantityCount
      direction: $direction
      notes: $notes
    ) {
      success
      message
      inventoryItem {
        id
        sku
        quantityKg
        quantityCount
      }
    }
  }
`);

// Admin: meat on hand at FIFO cost (remaining purchase lots).
export const InventoryValuationDoc = graphql(/* GraphQL */ `
  query InventoryValuation($factory: String) {
    inventoryValuation(factory: $factory) {
      success
      message
      rows {
        factory
        animalType
        kg
        value
        avgCostPerKg
      }
    }
  }
`);
