import { ADMIN_ROLE, FACTORY } from '../../../types/user/admin.type';

export default `#graphql
    enum ADMIN_ROLE {
        ${Object.values(ADMIN_ROLE).join('\n ')}
    }

    enum FACTORY {
        ${Object.values(FACTORY).join('\n ')}
    }

    type Admin {
        id: ID
        param: String
        role: ADMIN_ROLE
        # null = owner/admin (sees both factories)
        factory: FACTORY

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
        admins: AdminsResponse @auth(permissions: ["ADMIN"])
    }

    extend type Mutation {
        loginAdmin(
            param: String!
            password: String!
        ): LoginAdminResponse

        createAdmin(
            param: String!
            password: String!
            role: ADMIN_ROLE
            factory: FACTORY
        ): AdminResponse @auth(permissions: ["ADMIN"])

        updateAdmin(
            id: ID!
            param: String
            password: String
            role: ADMIN_ROLE
            factory: FACTORY
        ): AdminResponse @auth(permissions: ["ADMIN"])

        deleteAdmin(
            id: ID!
        ): Response @auth(permissions: ["ADMIN"])
    }
`;
