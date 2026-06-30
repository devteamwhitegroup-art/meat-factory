import { PaginationSchema } from "../global/global.type";

// animalType is the animal catalogue name (the String enum was removed).
export default `#graphql
    type ByproductWrapper {
        id: ID
        animalId: ID
        animal: Animal
        animalType: String
        name: String
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
        ): ByproductWrappersResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN", "STOREKEEPER"])
        byproductWrapper(id: ID!): ByproductWrapperResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN", "STOREKEEPER"])
    }

    extend type Mutation {
        createByproductWrapper(
            animalType: String!
            name: String!
        ): ByproductWrapperResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        updateByproductWrapper(
            id: ID!
            animalType: String
            name: String
            isActive: Boolean
        ): ByproductWrapperResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        deleteByproductWrapper(id: ID!): Response @auth(permissions: ["ADMIN", "SUPER_ADMIN"])
    }
`;
