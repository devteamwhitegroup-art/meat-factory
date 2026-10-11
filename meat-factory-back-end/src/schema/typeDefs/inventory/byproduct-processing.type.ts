import { PaginationSchema } from "../global/global.type";

export default `#graphql
    # One organ of a disassembly batch: norm-expected vs weighed kg.
    type ByproductProcessingLine {
        id: ID
        constantId: ID
        name: String
        expectedCount: Int
        # Null when the norm has no unitWeightKg.
        expectedKg: Float
        actualKg: Float
    }

    # Disassembly batch at the byproduct factory (FACTORY_3).
    type ByproductProcessing {
        id: ID
        # BP-YYYYMMDD-N
        code: String
        factory: String
        wrapperId: ID
        wrapper: ByproductWrapper
        bundleCount: Int
        notes: String
        createdBy: Admin
        lines: [ByproductProcessingLine]
        createdAt: Date
    }

    type ByproductProcessingResponse {
        success: Boolean
        message: String
        processing: ByproductProcessing
    }

    type ByproductProcessingsResponse {
        success: Boolean
        message: String
        processings: [ByproductProcessing]
        count: Int
    }

    type ByproductProcessingSummaryRow {
        animalType: String
        wrapperName: String
        name: String
        bundleCount: Int
        expectedKg: Float
        actualKg: Float
        diffKg: Float
        # Null when nothing was expected (norm without unitWeightKg).
        diffPercent: Float
    }

    type ByproductProcessingSummaryResponse {
        success: Boolean
        message: String
        items: [ByproductProcessingSummaryRow]
    }

    input ByproductProcessingLineInput {
        constantId: ID!
        actualKg: Float!
    }

    input ByproductTransferLineInput {
        inventoryItemId: ID!
        count: Int!
    }

    extend type Query {
        byproductProcessings(
            factory: String
            wrapperId: ID
            dateRange: DateRangeInput
            ${PaginationSchema}
        ): ByproductProcessingsResponse @auth(permissions: [BYPRODUCT_PROCESS])
        byproductProcessing(id: ID!): ByproductProcessingResponse @auth(permissions: [BYPRODUCT_PROCESS])
        # Expected vs actual kg per organ over a period.
        byproductProcessingSummary(
            factory: String
            dateRange: DateRangeInput
        ): ByproductProcessingSummaryResponse @auth(permissions: [BYPRODUCT_PROCESS])
    }

    extend type Mutation {
        # FACTORY_3 only. One line per active item of the wrapper.
        createByproductProcessing(
            factory: String
            wrapperId: ID!
            bundleCount: Int!
            lines: [ByproductProcessingLineInput!]!
            notes: String
        ): ByproductProcessingResponse @auth(permissions: [BYPRODUCT_PROCESS])

        # Send counted byproducts from FACTORY_1/2 stock to FACTORY_3.
        transferByproducts(
            fromFactory: String
            toFactory: String
            lines: [ByproductTransferLineInput!]!
            notes: String
        ): Response @auth(permissions: [BYPRODUCT_TRANSFER])
    }
`;
