import { PaginationSchema } from '../global/global.type';

export default `#graphql
    type HerderAddress {
        id: ID
        name: String
        isActive: Boolean
        createdAt: Date
        updatedAt: Date
    }

    type HerderAddressResponse {
        success: Boolean
        message: String
        herderAddress: HerderAddress
    }

    type HerderAddressesResponse {
        success: Boolean
        message: String
        herderAddresses: [HerderAddress]
        count: Int
    }

    extend type Query {
        # Any authenticated staff can read — intake + herder edit forms need
        # to populate the address dropdown regardless of role.
        herderAddresses(
            search: String
            isActive: Boolean
            ${PaginationSchema}
        ): HerderAddressesResponse @authLogin
        herderAddress(id: ID!): HerderAddressResponse @authLogin
    }

    extend type Mutation {
        createHerderAddress(
            name: String!
            isActive: Boolean
        ): HerderAddressResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        updateHerderAddress(
            id: ID!
            name: String
            isActive: Boolean
        ): HerderAddressResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        deleteHerderAddress(id: ID!): Response @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }
`;
