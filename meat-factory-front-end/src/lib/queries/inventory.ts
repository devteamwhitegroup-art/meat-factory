import { graphql } from '@/lib/gql/gql';

export const InventoryStockDoc = graphql(/* GraphQL */ `
  query InventoryStock(
    $productType: PRODUCT_TYPE
    $animalType: ANIMAL_TYPE
    $byproductType: BYPRODUCT_TYPE
  ) {
    inventoryStock(
      productType: $productType
      animalType: $animalType
      byproductType: $byproductType
    ) {
      success
      message
      count
      inventoryItems {
        id
        sku
        productType
        animalType
        byproductType
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
        item { id sku }
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
        meatAlertThresholdKg
        cargoCapacityKg
        alertActive
        cargosToClear
        lastAlertedAt
      }
    }
  }
`);

export const AdjustInventoryDoc = graphql(/* GraphQL */ `
  mutation AdjustInventory(
    $productType: PRODUCT_TYPE!
    $animalType: ANIMAL_TYPE
    $byproductType: BYPRODUCT_TYPE
    $quantityKg: Float!
    $direction: MOVEMENT_TYPE!
    $notes: String
  ) {
    adjustInventory(
      productType: $productType
      animalType: $animalType
      byproductType: $byproductType
      quantityKg: $quantityKg
      direction: $direction
      notes: $notes
    ) {
      success
      message
      inventoryItem { id sku quantityKg }
    }
  }
`);
