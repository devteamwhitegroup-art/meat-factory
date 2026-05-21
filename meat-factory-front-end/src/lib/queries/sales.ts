import { graphql } from '@/lib/gql/gql';

export const SalesListDoc = graphql(/* GraphQL */ `
  query SalesTransactions(
    $paymentStatus: PAYMENT_STATUS
    $customerId: ID
    $dateRange: DateRangeInput
    $limit: Int
    $page: Int
  ) {
    salesTransactions(
      paymentStatus: $paymentStatus
      customerId: $customerId
      dateRange: $dateRange
      limit: $limit
      page: $page
    ) {
      success
      message
      count
      salesTransactions {
        id
        transactionCode
        amount
        totalWeightKg
        paymentStatus
        transactionDate
        customer { id name }
      }
    }
  }
`);

export const SalesDetailDoc = graphql(/* GraphQL */ `
  query SalesTransaction($id: ID!) {
    salesTransaction(id: $id) {
      success
      message
      salesTransaction {
        id
        transactionCode
        amount
        totalWeightKg
        paymentStatus
        transactionDate
        paidAt
        notes
        customer { id name contactPhone bankAccount }
        lineItems {
          id
          productType
          animalType
          byproductType
          quantityKg
          unitPrice
          lineAmount
        }
        shipment { id shipmentCode status weightKg }
      }
    }
  }
`);

export const CreateSalesTransactionDoc = graphql(/* GraphQL */ `
  mutation CreateSalesTransaction(
    $customerId: ID!
    $amount: Float
    $transactionDate: Date
    $notes: String
    $lineItems: [SalesLineItemInput!]
  ) {
    createSalesTransaction(
      customerId: $customerId
      amount: $amount
      transactionDate: $transactionDate
      notes: $notes
      lineItems: $lineItems
    ) {
      success
      message
      salesTransaction { id transactionCode amount }
    }
  }
`);

export const MarkSalesTransactionPaidDoc = graphql(/* GraphQL */ `
  mutation MarkSalesTransactionPaid($id: ID!) {
    markSalesTransactionPaid(id: $id) {
      success
      message
      salesTransaction { id paymentStatus paidAt }
    }
  }
`);
