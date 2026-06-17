import { graphql } from '@/lib/gql/gql';

export const ShipmentListDoc = graphql(/* GraphQL */ `
  query Shipments(
    $status: SHIPMENT_STATUS
    $customerId: ID
    $salesTransactionId: ID
    $dateRange: DateRangeInput
    $limit: Int
    $page: Int
  ) {
    shipments(
      status: $status
      customerId: $customerId
      salesTransactionId: $salesTransactionId
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
        status
        weightKg
        shippedAt
        createdAt
        customer { id name }
        salesTransaction { id transactionCode }
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
        status
        weightKg
        shippedAt
        createdAt
        notes
        vehiclePlate
        driverName
        driverPhone
        serialNumber
        photo { id url }
        photos {
          id
          sequenceNo
          createdAt
          file { id url }
        }
        customer { id name contactPhone }
        salesTransaction {
          id
          transactionCode
          amount
          paymentStatus
        }
        cargoEntries {
          id
          productLabel
          pieceCount
          grossKg
          tareKg
          weightKg
          pricePerKg
          sequenceNo
          createdAt
          createdBy { id param }
        }
      }
    }
  }
`);

export const AddCargoEntryDoc = graphql(/* GraphQL */ `
  mutation AddCargoEntry(
    $shipmentId: ID!
    $productLabel: String!
    $pieceCount: Int
    $grossKg: Float
    $tareKg: Float
    $weightKg: Float
    $pricePerKg: Float
  ) {
    addCargoEntry(
      shipmentId: $shipmentId
      productLabel: $productLabel
      pieceCount: $pieceCount
      grossKg: $grossKg
      tareKg: $tareKg
      weightKg: $weightKg
      pricePerKg: $pricePerKg
    ) {
      success
      message
      cargoEntry {
        id
        productLabel
        pieceCount
        grossKg
        tareKg
        weightKg
        pricePerKg
        sequenceNo
      }
    }
  }
`);

export const UpdateCargoEntryPriceDoc = graphql(/* GraphQL */ `
  mutation UpdateCargoEntryPrice($id: ID!, $pricePerKg: Float) {
    updateCargoEntryPrice(id: $id, pricePerKg: $pricePerKg) {
      success
      message
      cargoEntry { id pricePerKg }
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
    $serialNumber: String
  ) {
    updateShipmentLoadingInfo(
      id: $id
      vehiclePlate: $vehiclePlate
      driverName: $driverName
      driverPhone: $driverPhone
      serialNumber: $serialNumber
    ) {
      success
      message
      shipment {
        id
        vehiclePlate
        driverName
        driverPhone
        serialNumber
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
        file { id url }
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
    $customerId: ID
    $salesTransactionId: ID
    $weightKg: Float!
    $vehiclePlate: String
    $driverName: String
    $driverPhone: String
    $serialNumber: String
    $notes: String
    $photoFileId: ID
  ) {
    createShipment(
      customerId: $customerId
      salesTransactionId: $salesTransactionId
      weightKg: $weightKg
      vehiclePlate: $vehiclePlate
      driverName: $driverName
      driverPhone: $driverPhone
      serialNumber: $serialNumber
      notes: $notes
      photoFileId: $photoFileId
    ) {
      success
      message
      shipment { id shipmentCode status }
    }
  }
`);

export const UpdateShipmentStatusDoc = graphql(/* GraphQL */ `
  mutation UpdateShipmentStatus($id: ID!, $status: SHIPMENT_STATUS!) {
    updateShipmentStatus(id: $id, status: $status) {
      success
      message
      shipment { id status shippedAt }
    }
  }
`);
