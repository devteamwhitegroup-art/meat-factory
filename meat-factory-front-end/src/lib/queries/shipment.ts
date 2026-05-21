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
        photo { id url }
        customer { id name contactPhone }
        salesTransaction {
          id
          transactionCode
          amount
          paymentStatus
        }
      }
    }
  }
`);

export const CreateShipmentDoc = graphql(/* GraphQL */ `
  mutation CreateShipment(
    $customerId: ID
    $salesTransactionId: ID
    $weightKg: Float!
    $notes: String
    $photoFileId: ID
  ) {
    createShipment(
      customerId: $customerId
      salesTransactionId: $salesTransactionId
      weightKg: $weightKg
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
