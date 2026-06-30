import { graphql } from "@/lib/gql/gql";

export const CustomerListDoc = graphql(/* GraphQL */ `
  query Customers(
    $search: String
    $isActive: Boolean
    $kind: CUSTOMER_KIND
    $limit: Int
    $page: Int
  ) {
    customers(
      search: $search
      isActive: $isActive
      kind: $kind
      limit: $limit
      page: $page
    ) {
      success
      message
      count
      customers {
        id
        name
        kind
        contactPhone
        address
        bankAccount
        registrationNumber
        taxId
        isActive
        createdAt
      }
    }
  }
`);

export const CustomerDoc = graphql(/* GraphQL */ `
  query Customer($id: ID!) {
    customer(id: $id) {
      success
      message
      customer {
        id
        name
        kind
        contactPhone
        address
        bankAccount
        registrationNumber
        taxId
        isActive
      }
    }
  }
`);

export const CreateCustomerDoc = graphql(/* GraphQL */ `
  mutation CreateCustomer(
    $name: String!
    $kind: CUSTOMER_KIND
    $contactPhone: String
    $address: String
    $bankAccount: String
    $registrationNumber: String
    $taxId: String
  ) {
    createCustomer(
      name: $name
      kind: $kind
      contactPhone: $contactPhone
      address: $address
      bankAccount: $bankAccount
      registrationNumber: $registrationNumber
      taxId: $taxId
    ) {
      success
      message
      customer {
        id
        name
        kind
      }
    }
  }
`);

export const UpdateCustomerDoc = graphql(/* GraphQL */ `
  mutation UpdateCustomer(
    $id: ID!
    $name: String
    $kind: CUSTOMER_KIND
    $contactPhone: String
    $address: String
    $bankAccount: String
    $registrationNumber: String
    $taxId: String
    $isActive: Boolean
  ) {
    updateCustomer(
      id: $id
      name: $name
      kind: $kind
      contactPhone: $contactPhone
      address: $address
      bankAccount: $bankAccount
      registrationNumber: $registrationNumber
      taxId: $taxId
      isActive: $isActive
    ) {
      success
      message
      customer {
        id
        name
        kind
        isActive
      }
    }
  }
`);

export const DeleteCustomerDoc = graphql(/* GraphQL */ `
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id) {
      success
      message
    }
  }
`);
