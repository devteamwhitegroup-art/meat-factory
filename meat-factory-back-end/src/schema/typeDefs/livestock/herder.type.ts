import { PaginationSchema } from '../global/global.type';

export default `#graphql
    type Herder {
        id: ID
        name: String
        registrationNo: String
        # Татвар төлөгчийн дугаар (ТТД, 11-14 digits) — seller on the eBarimt
        # the factory issues on the herder's behalf.
        tin: String
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

    type HerderAnimalTotal {
        animalType: String
        # Head brought in (registration animal lines).
        count: Int
        weightKg: Float
    }

    # Admin herder page: lifetime figures (cancelled registrations excluded
    # from the sums). Money comes from settlements.
    type HerderStats {
        registrationCount: Int
        cancelledCount: Int
        firstIntakeDate: Date
        lastIntakeDate: Date
        animals: [HerderAnimalTotal]
        weighedKg: Float
        meatAmount: Float
        settlementCount: Int
        slaughterCost: Float
        byproductAmount: Float
        netPayable: Float
        paidAmount: Float
        unpaidAmount: Float
    }

    type HerderStatsResponse {
        success: Boolean
        message: String
        stats: HerderStats
    }

    extend type Query {
        herders(search: String, ${PaginationSchema}): HerdersResponse @authLogin
        herder(id: ID!): HerderResponse @authLogin
        herderStats(id: ID!): HerderStatsResponse @auth(permissions: [HERDER_MANAGE])
    }

    extend type Mutation {
        createHerder(
            name: String!
            registrationNo: String!
            tin: String
            phone: String
            bankAccount: String
            bankName: String
            accountHolderName: String
            # Either addressId OR address must be set (server-side validated).
            addressId: ID
            address: String
        ): HerderResponse @auth(permissions: [HERDER_EDIT, REGISTRATION_CREATE])

        updateHerder(
            id: ID!
            name: String
            registrationNo: String
            tin: String
            phone: String
            bankAccount: String
            bankName: String
            accountHolderName: String
            addressId: ID
            address: String
        ): HerderResponse @auth(permissions: [HERDER_EDIT])

        deleteHerder(
            id: ID!
        ): Response @auth(permissions: [HERDER_MANAGE])
    }
`;
