import { PaginationSchema } from "../global/global.type";
import { CUSTOMER_KIND } from "../../../types/customer/customer.type";

export default `#graphql
    enum CUSTOMER_KIND {
        ${Object.values(CUSTOMER_KIND).join("\n ")}
    }

    type Customer {
        id: ID
        name: String
        # Tag-only — LOCAL_BROKER / ULAANBAATAR_BROKER (individual middle-men)
        # vs FACTORY (downstream meat factory). No field-level differences.
        kind: CUSTOMER_KIND
        contactPhone: String
        address: String
        bankAccount: String
        registrationNumber: String
        taxId: String
        isActive: Boolean
        createdAt: Date
        updatedAt: Date
        salesTransactions: [SalesTransaction]
        shipments: [Shipment]
    }

    type CustomerResponse {
        success: Boolean
        message: String
        customer: Customer
    }

    type CustomersResponse {
        success: Boolean
        message: String
        customers: [Customer]
        count: Int
    }

    extend type Query {
        customers(
            search: String
            isActive: Boolean
            kind: CUSTOMER_KIND
            ${PaginationSchema}
        ): CustomersResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
        customer(id: ID!): CustomerResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }

    extend type Mutation {
        createCustomer(
            name: String!
            kind: CUSTOMER_KIND
            contactPhone: String
            address: String
            bankAccount: String
            registrationNumber: String
            taxId: String
        ): CustomerResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        updateCustomer(
            id: ID!
            name: String
            kind: CUSTOMER_KIND
            contactPhone: String
            address: String
            bankAccount: String
            registrationNumber: String
            taxId: String
            isActive: Boolean
        ): CustomerResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        deleteCustomer(
            id: ID!
        ): Response @auth(permissions: ["ADMIN", "SUPER_ADMIN"])
    }
`;
