export default `#graphql
    type Admin {
        id: ID
        param: String
        role: Role
        # Factories.code; null = cross-factory role (sees every site)
        factory: String

        createdAt: Date
        updatedAt: Date
    }

     type AdminResponse {
        success: Boolean
        message: String
        admin: Admin
    }

    type AdminsResponse {
        success: Boolean
        message: String
        admins: [Admin]
        count: Int
    }

    type LoginAdminResponse {
        success: Boolean
        message: String
        admin: Admin
        token: String
    }

    extend type Query {
        currentAdmin: AdminResponse @authLogin
        admins: AdminsResponse @auth(permissions: [STAFF_MANAGE])
    }

    extend type Mutation {
        loginAdmin(
            param: String!
            password: String!
        ): LoginAdminResponse

        createAdmin(
            param: String!
            password: String!
            roleId: ID!
            factory: String
        ): AdminResponse @auth(permissions: [STAFF_MANAGE])

        updateAdmin(
            id: ID!
            param: String
            password: String
            roleId: ID
            factory: String
        ): AdminResponse @auth(permissions: [STAFF_MANAGE])

        deleteAdmin(
            id: ID!
        ): Response @auth(permissions: [STAFF_MANAGE])
    }
`;
