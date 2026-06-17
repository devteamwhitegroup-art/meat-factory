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
        animalType: ANIMAL_TYPE
        byproductType: BYPRODUCT_TYPE
        quantityKg: Float
        unitPrice: Float
        lineAmount: Float
        createdAt: Date
        updatedAt: Date
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

    type SalesTransaction {
        id: ID
        transactionCode: String
        customerId: ID
        customer: Customer
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
        shipment: Shipment
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
        animalType: ANIMAL_TYPE
        byproductType: BYPRODUCT_TYPE
        quantityKg: Float!
        unitPrice: Float!
    }

    extend type Query {
        salesTransactions(
            paymentStatus: PAYMENT_STATUS
            customerId: ID
            dateRange: DateRangeInput
            ${PaginationSchema}
        ): SalesTransactionsResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
        salesTransaction(id: ID!): SalesTransactionResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }

    extend type Mutation {
        createSalesTransaction(
            customerId: ID!
            amount: Float
            transactionDate: Date
            notes: String
            lineItems: [SalesLineItemInput!]
        ): SalesTransactionResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        markSalesTransactionPaid(
            id: ID!
        ): SalesTransactionResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        addSalesInstallment(
            salesTransactionId: ID!
            amountMnt: Float!
            paidAt: Date
            notes: String
        ): SalesInstallmentResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        removeSalesInstallment(id: ID!): Response @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }
`;
