import {
  PAYMENT_STATUS,
  PRODUCT_TYPE
} from '../../../types/sales/sales-transaction.type';
import { PaginationSchema } from '../global/global.type';

export default `#graphql
    enum PAYMENT_STATUS {
        ${Object.values(PAYMENT_STATUS).join('\n ')}
    }

    enum PRODUCT_TYPE {
        ${Object.values(PRODUCT_TYPE).join('\n ')}
    }

    type SalesLineItem {
        id: ID
        salesTransactionId: ID
        productType: PRODUCT_TYPE
        animalType: String
        byproductName: String
        quantityKg: Float
        # Null on a line auto-created from an unpriced shipment sale-line
        # group — fill in via setSalesLineItemPrice.
        unitPrice: Float
        lineAmount: Float
        createdAt: Date
        updatedAt: Date
    }

    type SalesLineItemResponse {
        success: Boolean
        message: String
        lineItem: SalesLineItem
    }

    # One partial payment against a SalesTransaction. Outstanding =
    # tx.amount − Σ(installments.amountMnt). When ≤ 0 the tx auto-flips PAID.
    type SalesInstallment {
        id: ID
        salesTransactionId: ID
        amountMnt: Float
        paidAt: Date
        notes: String
        createdById: ID
        createdBy: Admin
        createdAt: Date
        updatedAt: Date
    }

    type SalesInstallmentResponse {
        success: Boolean
        message: String
        installment: SalesInstallment
    }

    # A cost paid to complete the sale (fuel, parking…). The customer's bill
    # is untouched; net = amount − Σ(expenses.amountMnt).
    type SalesExpense {
        id: ID
        salesTransactionId: ID
        name: String
        amountMnt: Float
        notes: String
        createdById: ID
        createdBy: Admin
        createdAt: Date
    }

    type SalesExpenseResponse {
        success: Boolean
        message: String
        expense: SalesExpense
    }

    type SalesTransaction {
        id: ID
        transactionCode: String
        customerId: ID
        customer: Customer
        # Set when this invoice was auto-created from a delivered shipment.
        # Null for manually-created transactions (via createSalesTransaction).
        shipmentId: ID
        shipment: Shipment
        totalWeightKg: Float
        amount: Float
        paymentStatus: PAYMENT_STATUS
        transactionDate: Date
        paidAt: Date
        createdById: ID
        createdBy: Admin
        notes: String
        lineItems: [SalesLineItem]
        installments: [SalesInstallment]
        expenses: [SalesExpense]
        createdAt: Date
        updatedAt: Date
    }

    type SalesTransactionResponse {
        success: Boolean
        message: String
        salesTransaction: SalesTransaction
    }

    type SalesTransactionsResponse {
        success: Boolean
        message: String
        salesTransactions: [SalesTransaction]
        count: Int
    }

    input SalesLineItemInput {
        productType: PRODUCT_TYPE!
        animalType: String
        byproductName: String
        quantityKg: Float!
        unitPrice: Float!
    }

    extend type Query {
        salesTransactions(
            paymentStatus: PAYMENT_STATUS
            customerId: ID
            dateRange: DateRangeInput
            ${PaginationSchema}
        ): SalesTransactionsResponse @auth(permissions: [SALES_MANAGE])
        salesTransaction(id: ID!): SalesTransactionResponse @auth(permissions: [SALES_MANAGE])
    }

    extend type Mutation {
        createSalesTransaction(
            customerId: ID!
            amount: Float
            transactionDate: Date
            notes: String
            lineItems: [SalesLineItemInput!]
        ): SalesTransactionResponse @auth(permissions: [SALES_MANAGE])

        markSalesTransactionPaid(
            id: ID!
        ): SalesTransactionResponse @auth(permissions: [SALES_MANAGE])

        # Fill in (or clear, pass null) the per-kg price on one line item. A
        # shipment's invoice lines are rebuilt from its sales report whenever
        # the report changes, overriding prices set here. The parent
        # transaction's amount recomputes automatically, staying null until
        # every line is priced.
        setSalesLineItemPrice(
            id: ID!
            unitPrice: Float
        ): SalesLineItemResponse @auth(permissions: [SALES_MANAGE])

        addSalesInstallment(
            salesTransactionId: ID!
            amountMnt: Float!
            paidAt: Date
            notes: String
        ): SalesInstallmentResponse @auth(permissions: [SALES_MANAGE])

        removeSalesInstallment(id: ID!): Response @auth(permissions: [SALES_MANAGE])

        addSalesExpense(
            salesTransactionId: ID!
            name: String!
            amountMnt: Float!
            notes: String
        ): SalesExpenseResponse @auth(permissions: [SALES_MANAGE])

        removeSalesExpense(id: ID!): Response @auth(permissions: [SALES_MANAGE])
    }
`;
