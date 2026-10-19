import { FACTORY_KIND } from "../../../types/factory/factory.type";

export default `#graphql
    # What a site does — every factory rule branches on this, never on a code.
    enum FACTORY_KIND {
        ${Object.values(FACTORY_KIND).join("\n ")}
    }

    # Admin-managed site. \`code\` is what every \`factory\` field carries.
    type Factory {
        code: String!
        name: String!
        kind: FACTORY_KIND!
        isActive: Boolean!
        createdAt: Date
        updatedAt: Date
    }

    type FactoryResponse {
        success: Boolean
        message: String
        factory: Factory
    }

    type FactoriesResponse {
        success: Boolean
        message: String
        factories: [Factory!]
    }

    # A site's priced byproduct: whole гэдэс (wrapperId) or, PRE_BUTCHERED
    # only, a single item (constantId). PRE_BUTCHERED price is editable per intake.
    type FactoryByproduct {
        id: ID
        factory: String
        wrapperId: ID
        constantId: ID
        name: String
        animalType: String
        price: Float
    }

    type FactoryByproductsResponse {
        success: Boolean
        message: String
        factoryByproducts: [FactoryByproduct!]
    }

    extend type Query {
        factories(includeInactive: Boolean): FactoriesResponse @authLogin
        factoryByproducts(factory: String!): FactoryByproductsResponse @auth(permissions: [SETTINGS_MANAGE])
    }

    extend type Mutation {
        # code: A-Z, 0-9, _ (e.g. FACTORY_4). Kind is fixed after creation.
        createFactory(
            code: String!
            name: String!
            kind: FACTORY_KIND!
        ): FactoryResponse @auth(permissions: [SETTINGS_MANAGE])

        updateFactory(
            code: String!
            name: String
            isActive: Boolean
        ): FactoryResponse @auth(permissions: [SETTINGS_MANAGE])

        # Adds or re-prices. wrapperId = whole гэдэс; constantId = single
        # item (PRE_BUTCHERED only).
        setFactoryByproduct(
            factory: String!
            wrapperId: ID
            constantId: ID
            price: Float!
        ): Response @auth(permissions: [SETTINGS_MANAGE])

        deleteFactoryByproduct(id: ID!): Response @auth(permissions: [SETTINGS_MANAGE])
    }
`;
