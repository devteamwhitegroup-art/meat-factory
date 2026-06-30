import { PaginationSchema } from '../global/global.type';

// animalType filter is the animal catalogue name (the ANIMAL_TYPE enum was
// removed), reached through wrapper → animal, not stored on the constant.
export default `#graphql
    type ByproductConstant {
        id: ID
        wrapperId: ID
        name: String
        quantityPerAnimal: Int
        unitWeightKg: Float
        isActive: Boolean
        createdAt: Date
        updatedAt: Date
    }

    type ByproductConstantResponse {
        success: Boolean
        message: String
        byproductConstant: ByproductConstant
    }

    type ByproductConstantsResponse {
        success: Boolean
        message: String
        byproductConstants: [ByproductConstant]
        count: Int
    }

    extend type Query {
        byproductConstants(
            wrapperId: ID
            animalType: String
            search: String
            isActive: Boolean
            ${PaginationSchema}
        ): ByproductConstantsResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
        byproductConstant(id: ID!): ByproductConstantResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }

    extend type Mutation {
        createByproductConstant(
            wrapperId: ID!
            name: String!
            quantityPerAnimal: Int!
            unitWeightKg: Float
        ): ByproductConstantResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        updateByproductConstant(
            id: ID!
            wrapperId: ID
            name: String
            quantityPerAnimal: Int
            unitWeightKg: Float
            isActive: Boolean
        ): ByproductConstantResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        deleteByproductConstant(id: ID!): Response @auth(permissions: ["ADMIN", "SUPER_ADMIN"])
    }
`;
