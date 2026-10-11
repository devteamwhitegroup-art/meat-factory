import { PERMISSION } from "../../../types/user/permission.type";

export default `#graphql
    # Fine-grained switches a Role is assembled from. @auth(permissions: [...])
    # on a field = the actor's role must hold ANY of the listed ones.
    enum PERMISSION {
        ${Object.values(PERMISSION).join("\n ")}
    }

    type PermissionItem {
        key: PERMISSION!
        label: String!
    }

    type PermissionGroup {
        group: String!
        items: [PermissionItem!]!
    }

    type Role {
        id: ID
        name: String
        permissions: [PERMISSION!]
        # Spans every factory (its admins carry no factory).
        crossFactory: Boolean
        # Seeded owner role: undeletable, always holds every permission.
        isSystem: Boolean
        createdAt: Date
        updatedAt: Date
    }

    type RoleResponse {
        success: Boolean
        message: String
        role: Role
    }

    type RolesResponse {
        success: Boolean
        message: String
        roles: [Role]
    }

    type PermissionCatalogResponse {
        success: Boolean
        message: String
        groups: [PermissionGroup!]
    }

    extend type Query {
        roles: RolesResponse @authLogin
        permissionCatalog: PermissionCatalogResponse @auth(permissions: [STAFF_MANAGE])
    }

    extend type Mutation {
        createRole(
            name: String!
            permissions: [PERMISSION!]!
            crossFactory: Boolean
        ): RoleResponse @auth(permissions: [STAFF_MANAGE])

        # crossFactory is fixed at creation; the system role's permissions too.
        updateRole(
            id: ID!
            name: String
            permissions: [PERMISSION!]
        ): RoleResponse @auth(permissions: [STAFF_MANAGE])

        # Refused for the system role or while any staff account uses it.
        deleteRole(id: ID!): Response @auth(permissions: [STAFF_MANAGE])
    }
`;
