import { graphql } from "@/lib/gql/gql";

export const ShipmentListDoc = graphql(/* GraphQL */ `
  query Shipments(
    $category: SHIPMENT_CATEGORY
    $domesticMarket: DOMESTIC_MARKET
    $status: SHIPMENT_STATUS
    $customerId: ID
    $dateRange: DateRangeInput
    $limit: Int
    $page: Int
  ) {
    shipments(
      category: $category
      domesticMarket: $domesticMarket
      status: $status
      customerId: $customerId
      dateRange: $dateRange
      limit: $limit
      page: $page
    ) {
      success
      message
      count
      shipments {
        id
        shipmentCode
        category
        domesticMarket
        status
        weightKg
        totalPrice
        shippedAt
        createdAt
        customer {
          id
          name
        }
      }
    }
  }
`);

export const ShipmentDetailDoc = graphql(/* GraphQL */ `
  query Shipment($id: ID!) {
    shipment(id: $id) {
      success
      message
      shipment {
        id
        shipmentCode
        category
        domesticMarket
        status
        weightKg
        totalPrice
        pricedAt
        shippedAt
        createdAt
        notes
        vehiclePlate
        driverName
        driverPhone
        serialNumber
        photo {
          id
          url
        }
        photos {
          id
          sequenceNo
          createdAt
          file {
            id
            url
          }
        }
        customer {
          id
          name
          contactPhone
        }
        cargoEntries {
          id
          productType
          animalType
          byproductName
          sourceConstantId
          productLabel
          pieceCount
          grossKg
          tareKg
          weightKg
          sequenceNo
          createdAt
          createdBy {
            id
            param
          }
        }
        saleLines {
          id
          productType
          animalType
          byproductName
          totalWeightKg
          pricePerKg
          amount
        }
      }
    }
  }
`);

export const AddCargoEntryDoc = graphql(/* GraphQL */ `
  mutation AddCargoEntry(
    $shipmentId: ID!
    $productType: PRODUCT_TYPE!
    $animalType: String
    $byproductName: String
    $sourceConstantId: ID
    $productLabel: String
    $pieceCount: Int
    $grossKg: Float
    $tareKg: Float
    $weightKg: Float
  ) {
    addCargoEntry(
      shipmentId: $shipmentId
      productType: $productType
      animalType: $animalType
      byproductName: $byproductName
      sourceConstantId: $sourceConstantId
      productLabel: $productLabel
      pieceCount: $pieceCount
      grossKg: $grossKg
      tareKg: $tareKg
      weightKg: $weightKg
    ) {
      success
      message
      cargoEntry {
        id
        productType
        animalType
        byproductName
        sourceConstantId
        productLabel
        pieceCount
        grossKg
        tareKg
        weightKg
        sequenceNo
      }
    }
  }
`);

export const SetShipmentSalePriceDoc = graphql(/* GraphQL */ `
  mutation SetShipmentSalePrice($id: ID!, $pricePerKg: Float) {
    setShipmentSalePrice(id: $id, pricePerKg: $pricePerKg) {
      success
      message
      saleLine {
        id
        pricePerKg
        amount
      }
    }
  }
`);

export const DeleteCargoEntryDoc = graphql(/* GraphQL */ `
  mutation DeleteCargoEntry($id: ID!) {
    deleteCargoEntry(id: $id) {
      success
      message
    }
  }
`);

export const UpdateShipmentLoadingInfoDoc = graphql(/* GraphQL */ `
  mutation UpdateShipmentLoadingInfo(
    $id: ID!
    $vehiclePlate: String
    $driverName: String
    $driverPhone: String
  ) {
    updateShipmentLoadingInfo(
      id: $id
      vehiclePlate: $vehiclePlate
      driverName: $driverName
      driverPhone: $driverPhone
    ) {
      success
      message
      shipment {
        id
        vehiclePlate
        driverName
        driverPhone
      }
    }
  }
`);

export const AddShipmentPhotoDoc = graphql(/* GraphQL */ `
  mutation AddShipmentPhoto($shipmentId: ID!, $fileId: ID!) {
    addShipmentPhoto(shipmentId: $shipmentId, fileId: $fileId) {
      success
      message
      photo {
        id
        sequenceNo
        createdAt
        file {
          id
          url
        }
      }
    }
  }
`);

export const RemoveShipmentPhotoDoc = graphql(/* GraphQL */ `
  mutation RemoveShipmentPhoto($id: ID!) {
    removeShipmentPhoto(id: $id) {
      success
      message
    }
  }
`);

export const CreateShipmentDoc = graphql(/* GraphQL */ `
  mutation CreateShipment(
    $category: SHIPMENT_CATEGORY!
    $domesticMarket: DOMESTIC_MARKET
    $customerId: ID!
    $vehiclePlate: String
    $driverName: String
    $driverPhone: String
    $notes: String
    $photoFileId: ID
  ) {
    createShipment(
      category: $category
      domesticMarket: $domesticMarket
      customerId: $customerId
      vehiclePlate: $vehiclePlate
      driverName: $driverName
      driverPhone: $driverPhone
      notes: $notes
      photoFileId: $photoFileId
    ) {
      success
      message
      shipment {
        id
        shipmentCode
        status
      }
    }
  }
`);

export const NextShipmentSerialDoc = graphql(/* GraphQL */ `
  query NextShipmentSerial {
    nextShipmentSerial {
      success
      message
      serialNumber
    }
  }
`);

export const UpdateShipmentStatusDoc = graphql(/* GraphQL */ `
  mutation UpdateShipmentStatus($id: ID!, $status: SHIPMENT_STATUS!) {
    updateShipmentStatus(id: $id, status: $status) {
      success
      message
      shipment {
        id
        status
        shippedAt
      }
    }
  }
`);
