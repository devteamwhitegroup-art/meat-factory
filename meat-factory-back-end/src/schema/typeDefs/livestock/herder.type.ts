import { PaginationSchema } from '../global/global.type';

export default `#graphql
    type Herder {
        id: ID
        name: String
        registrationNo: String
        phone: String
        bankAccount: String
        address: String
        createdAt: Date
        updatedAt: Date
        registrations: [Registration]
    }

    type HerderResponse {
        success: Boolean
        message: String
        herder: Herder
    }

    type HerdersResponse {
        success: Boolean
        message: String
        herders: [Herder]
        count: Int
    }

    extend type Query {
        herders(search: String, ${PaginationSchema}): HerdersResponse @adminAuth
        herder(id: ID!): HerderResponse @adminAuth
    }

    extend type Mutation {
        createHerder(
            name: String!
            registrationNo: String!
            phone: String
            bankAccount: String
            address: String!
        ): HerderResponse @adminAuth(permissions: ["SUPER_ADMIN", "ADMIN", "MANAGER", "GUARD"])

        updateHerder(
            id: ID!
            name: String
            registrationNo: String
            phone: String
            bankAccount: String
            address: String
        ): HerderResponse @adminAuth(permissions: ["SUPER_ADMIN", "ADMIN", "MANAGER", "GUARD"])

        deleteHerder(
            id: ID!
        ): Response @adminAuth(permissions: ["SUPER_ADMIN", "MANAGER"])
    }
`;
