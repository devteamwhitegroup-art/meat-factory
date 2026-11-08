import { graphql } from "@/lib/gql/gql";

export const OrderListDoc = graphql(/* GraphQL */ `
  query Orders($status: ORDER_STATUS, $search: String, $limit: Int, $page: Int) {
    orders(status: $status, search: $search, limit: $limit, page: $page) {
      success
      message
      count
      orders {
        id
        code
        customerName
        phone
        address
        note
        total
        status
        paidAt
        createdAt
        lines {
          name
          unitPrice
          quantity
          items {
            name
            kg
          }
        }
      }
    }
  }
`);

export const SetOrderStatusDoc = graphql(/* GraphQL */ `
  mutation SetOrderStatus($id: ID!, $status: ORDER_STATUS!) {
    setOrderStatus(id: $id, status: $status) {
      success
      message
    }
  }
`);

export const CheckOrderPaymentDoc = graphql(/* GraphQL */ `
  mutation CheckOrderPayment($id: ID!) {
    checkOrderPayment(id: $id) {
      success
      message
      payment {
        status
      }
    }
  }
`);

export const OrderPackageListDoc = graphql(/* GraphQL */ `
  query OrderPackages {
    orderPackages {
      success
      message
      orderPackages {
        id
        name
        description
        price
        isActive
        items {
          name
          kg
        }
        thumbnail {
          id
          url
        }
        images {
          id
          url
        }
      }
    }
  }
`);

export const CreateOrderPackageDoc = graphql(/* GraphQL */ `
  mutation CreateOrderPackage(
    $name: String!
    $description: String
    $price: Int!
    $items: [OrderPackageItemInput!]
    $thumbnailFileId: ID
    $imageFileIds: [ID!]
  ) {
    createOrderPackage(
      name: $name
      description: $description
      price: $price
      items: $items
      thumbnailFileId: $thumbnailFileId
      imageFileIds: $imageFileIds
    ) {
      success
      message
    }
  }
`);

export const UpdateOrderPackageDoc = graphql(/* GraphQL */ `
  mutation UpdateOrderPackage(
    $id: ID!
    $name: String
    $description: String
    $price: Int
    $items: [OrderPackageItemInput!]
    $thumbnailFileId: ID
    $imageFileIds: [ID!]
    $isActive: Boolean
  ) {
    updateOrderPackage(
      id: $id
      name: $name
      description: $description
      price: $price
      items: $items
      thumbnailFileId: $thumbnailFileId
      imageFileIds: $imageFileIds
      isActive: $isActive
    ) {
      success
      message
    }
  }
`);

export const DeleteOrderPackageDoc = graphql(/* GraphQL */ `
  mutation DeleteOrderPackage($id: ID!) {
    deleteOrderPackage(id: $id) {
      success
      message
    }
  }
`);
