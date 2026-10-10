import { graphql } from "@/lib/gql/gql";

export const InventoryStockDoc = graphql(/* GraphQL */ `
  query InventoryStock(
    $factory: FACTORY
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
    $factory: FACTORY
    $inventoryItemId: ID
    $movementType: MOVEMENT_TYPE
    $source: MOVEMENT_SOURCE
    $dateRange: DateRangeInput
    $limit: Int
    $page: Int
  ) {
    inventoryMovements(
      factory: $factory
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
        item {
          id
          factory
          sku
        }
      }
    }
  }
`);

export const InventoryStatsDoc = graphql(/* GraphQL */ `
  query InventoryStats($factory: FACTORY) {
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
    $factory: FACTORY
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
