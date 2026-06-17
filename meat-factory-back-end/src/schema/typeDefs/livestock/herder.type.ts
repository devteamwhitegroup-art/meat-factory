import { PaginationSchema } from '../global/global.type';

export default `#graphql
    type Herder {
        id: ID
        name: String
        registrationNo: String
        phone: String
        # Bank fields — for settlement payouts.
        bankAccount: String
        bankName: String
        accountHolderName: String
        # Address: addressId references the admin catalogue; addressEntry is
        # the joined row. The legacy address field stays as a String —
        # resolver returns addressEntry.name with a fallback to the legacy
        # column so older FE callers don't break.
        addressId: ID
        addressEntry: HerderAddress
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
        herders(search: String, ${PaginationSchema}): HerdersResponse @authLogin
        herder(id: ID!): HerderResponse @authLogin
    }

    extend type Mutation {
        createHerder(
            name: String!
            registrationNo: String!
            phone: String
            bankAccount: String
            bankName: String
            accountHolderName: String
            # Either addressId OR address must be set (server-side validated).
            addressId: ID
            address: String
        ): HerderResponse @auth(permissions: ["SUPER_ADMIN", "ADMIN", "MANAGER", "GUARD"])

        updateHerder(
            id: ID!
            name: String
            registrationNo: String
            phone: String
            bankAccount: String
            bankName: String
            accountHolderName: String
            addressId: ID
            address: String
        ): HerderResponse @auth(permissions: ["SUPER_ADMIN", "ADMIN", "MANAGER", "GUARD"])

        deleteHerder(
            id: ID!
        ): Response @auth(permissions: ["SUPER_ADMIN", "MANAGER"])
    }
`;
