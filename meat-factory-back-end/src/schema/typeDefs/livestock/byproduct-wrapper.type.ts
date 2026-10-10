import { PaginationSchema } from "../global/global.type";

// animalType is the animal catalogue name (the String enum was removed).
export default `#graphql
    type ByproductWrapper {
        id: ID
        animalId: ID
        animal: Animal
        animalType: String
        name: String
        # Credited to the herder per bundle the factory keeps.
        price: Float
        isActive: Boolean
        items: [ByproductConstant]
        createdAt: Date
        updatedAt: Date
    }

    type ByproductWrapperResponse {
        success: Boolean
        message: String
        byproductWrapper: ByproductWrapper
    }

    type ByproductWrappersResponse {
        success: Boolean
        message: String
        byproductWrappers: [ByproductWrapper]
        count: Int
    }

    extend type Query {
        byproductWrappers(
            animalType: String
            search: String
            isActive: Boolean
            ${PaginationSchema}
        ): ByproductWrappersResponse @auth(permissions: ["ADMIN", "STOREKEEPER"])
        byproductWrapper(id: ID!): ByproductWrapperResponse @auth(permissions: ["ADMIN", "STOREKEEPER"])
    }

    extend type Mutation {
        createByproductWrapper(
            animalType: String!
            name: String!
            price: Float
        ): ByproductWrapperResponse @auth(permissions: ["ADMIN"])

        updateByproductWrapper(
            id: ID!
            animalType: String
            name: String
            price: Float
            isActive: Boolean
        ): ByproductWrapperResponse @auth(permissions: ["ADMIN"])

        deleteByproductWrapper(id: ID!): Response @auth(permissions: ["ADMIN"])
    }
`;
