import { graphql } from "@/lib/gql/gql";

// Factory → factory shipments (no customer / invoice). Sender's stock leaves
// on send; receiver's grows on receive; cancel returns it to the sender.
export const FactoryTransfersDoc = graphql(/* GraphQL */ `
  query FactoryTransfers(
    $status: FACTORY_TRANSFER_STATUS
    $factory: String
    $page: Int
    $limit: Int
  ) {
    factoryTransfers(
      status: $status
      factory: $factory
      page: $page
      limit: $limit
    ) {
      success
      message
      count
      transfers {
        id
        code
        fromFactory
        toFactory
        status
        notes
        createdAt
        closedAt
        sentBy {
          id
          param
        }
        closedBy {
          id
          param
        }
        lines {
          id
          productType
          animal {
            id
            name
          }
          byproductName
          quantityKg
          quantityCount
        }
      }
    }
  }
`);

export const CreateFactoryTransferDoc = graphql(/* GraphQL */ `
  mutation CreateFactoryTransfer(
    $fromFactory: String
    $toFactory: String!
    $lines: [FactoryTransferLineInput!]!
    $notes: String
  ) {
    createFactoryTransfer(
      fromFactory: $fromFactory
      toFactory: $toFactory
      lines: $lines
      notes: $notes
    ) {
      success
      message
      transfer {
        id
        code
      }
    }
  }
`);

export const ReceiveFactoryTransferDoc = graphql(/* GraphQL */ `
  mutation ReceiveFactoryTransfer($id: ID!) {
    receiveFactoryTransfer(id: $id) {
      success
      message
    }
  }
`);

export const CancelFactoryTransferDoc = graphql(/* GraphQL */ `
  mutation CancelFactoryTransfer($id: ID!) {
    cancelFactoryTransfer(id: $id) {
      success
      message
    }
  }
`);
