import { ADMIN_ROLE } from '../../../types/user/admin.type';

export default `#graphql
    enum ADMIN_ROLE {
        ${Object.values(ADMIN_ROLE).join('\n ')}
    }

    type Admin {
        id: ID
        param: String
        role: ADMIN_ROLE

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
        currentAdmin: AdminResponse @adminAuth
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
        ): AdminResponse @adminAuth(permissions: ["SUPER_ADMIN", "MANAGER"])

        updateAdmin(
            id: ID!
            param: String
            password: String
            role: ADMIN_ROLE
        ): AdminResponse @adminAuth(permissions: ["SUPER_ADMIN", "MANAGER"])

        deleteAdmin(
            id: ID!
        ): Response @adminAuth(permissions: ["SUPER_ADMIN"])
    }
`;
