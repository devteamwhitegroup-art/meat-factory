import { graphql } from "@/lib/gql/gql";

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
        customer {
          id
          name
        }
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
        customer {
          id
          name
          contactPhone
          bankAccount
        }
        lineItems {
          id
          productType
          animalType
          byproductName
          quantityKg
          unitPrice
          lineAmount
        }
        installments {
          id
          amountMnt
          paidAt
          notes
          createdAt
          createdBy {
            id
            param
          }
        }
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
      salesTransaction {
        id
        transactionCode
        amount
      }
    }
  }
`);

export const MarkSalesTransactionPaidDoc = graphql(/* GraphQL */ `
  mutation MarkSalesTransactionPaid($id: ID!) {
    markSalesTransactionPaid(id: $id) {
      success
      message
      salesTransaction {
        id
        paymentStatus
        paidAt
      }
    }
  }
`);

export const AddSalesInstallmentDoc = graphql(/* GraphQL */ `
  mutation AddSalesInstallment(
    $salesTransactionId: ID!
    $amountMnt: Float!
    $paidAt: Date
    $notes: String
  ) {
    addSalesInstallment(
      salesTransactionId: $salesTransactionId
      amountMnt: $amountMnt
      paidAt: $paidAt
      notes: $notes
    ) {
      success
      message
      installment {
        id
        amountMnt
        paidAt
        notes
      }
    }
  }
`);

export const RemoveSalesInstallmentDoc = graphql(/* GraphQL */ `
  mutation RemoveSalesInstallment($id: ID!) {
    removeSalesInstallment(id: $id) {
      success
      message
    }
  }
`);
