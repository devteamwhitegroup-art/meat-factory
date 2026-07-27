import { graphql } from "@/lib/gql/gql";

export const InventoryStockDoc = graphql(/* GraphQL */ `
  query InventoryStock(
    $productType: PRODUCT_TYPE
    $animalId: ID
    $byproductName: String
  ) {
    inventoryStock(
      productType: $productType
      animalId: $animalId
      byproductName: $byproductName
    ) {
      success
      message
      count
      inventoryItems {
        id
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
        updatedAt
      }
    }
  }
`);

export const InventoryMovementsDoc = graphql(/* GraphQL */ `
  query InventoryMovements(
    $inventoryItemId: ID
    $movementType: MOVEMENT_TYPE
    $source: MOVEMENT_SOURCE
    $dateRange: DateRangeInput
    $limit: Int
    $page: Int
  ) {
    inventoryMovements(
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
        createdAt
        notes
        item {
          id
          sku
        }
      }
    }
  }
`);

export const InventoryStatsDoc = graphql(/* GraphQL */ `
  query InventoryStats {
    inventoryStats {
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
    $productType: PRODUCT_TYPE!
    $animalId: ID
    $byproductName: String
    $quantityKg: Float!
    $direction: MOVEMENT_TYPE!
    $notes: String
  ) {
    adjustInventory(
      productType: $productType
      animalId: $animalId
      byproductName: $byproductName
      quantityKg: $quantityKg
      direction: $direction
      notes: $notes
    ) {
      success
      message
      inventoryItem {
        id
        sku
        quantityKg
      }
    }
  }
`);
