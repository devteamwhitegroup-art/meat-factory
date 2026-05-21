import { PaginationSchema } from '../global/global.type';

export default `#graphql
    type Customer {
        id: ID
        name: String
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
        customers(search: String, isActive: Boolean, ${PaginationSchema}): CustomersResponse @adminAuth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
        customer(id: ID!): CustomerResponse @adminAuth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }

    extend type Mutation {
        createCustomer(
            name: String!
            contactPhone: String
            address: String
            bankAccount: String
            registrationNumber: String
            taxId: String
        ): CustomerResponse @adminAuth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        updateCustomer(
            id: ID!
            name: String
            contactPhone: String
            address: String
            bankAccount: String
            registrationNumber: String
            taxId: String
            isActive: Boolean
        ): CustomerResponse @adminAuth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        deleteCustomer(
            id: ID!
        ): Response @adminAuth(permissions: ["ADMIN", "SUPER_ADMIN"])
    }
`;
