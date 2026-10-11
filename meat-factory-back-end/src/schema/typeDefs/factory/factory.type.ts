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

    extend type Query {
        factories(includeInactive: Boolean): FactoriesResponse @authLogin
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
    }
`;
