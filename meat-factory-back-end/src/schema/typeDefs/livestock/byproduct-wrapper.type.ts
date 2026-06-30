import { PaginationSchema } from "../global/global.type";

// ANIMAL_TYPE declared once in registration.type.ts; ByproductConstant +
// Animal declared in their own typedefs — referenced here, not redeclared.
export default `#graphql
    type ByproductWrapper {
        id: ID
        animalId: ID
        animal: Animal
        animalType: ANIMAL_TYPE
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
            animalType: ANIMAL_TYPE
            search: String
            isActive: Boolean
            ${PaginationSchema}
        ): ByproductWrappersResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN", "STOREKEEPER"])
        byproductWrapper(id: ID!): ByproductWrapperResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN", "STOREKEEPER"])
    }

    extend type Mutation {
        createByproductWrapper(
            animalType: ANIMAL_TYPE!
            name: String!
        ): ByproductWrapperResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        updateByproductWrapper(
            id: ID!
            animalType: ANIMAL_TYPE
            name: String
            isActive: Boolean
        ): ByproductWrapperResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        deleteByproductWrapper(id: ID!): Response @auth(permissions: ["ADMIN", "SUPER_ADMIN"])
    }
`;
