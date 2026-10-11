import { graphql } from "@/lib/gql/gql";

// Staff accounts — managed from Систем тохиргоо. `param` is the login.
export const AdminsDoc = graphql(/* GraphQL */ `
  query Admins {
    admins {
      success
      message
      admins {
        id
        param
        factory
        role {
          id
          name
          crossFactory
        }
      }
    }
  }
`);

export const CreateAdminDoc = graphql(/* GraphQL */ `
  mutation CreateAdmin(
    $param: String!
    $password: String!
    $roleId: ID!
    $factory: String
  ) {
    createAdmin(
      param: $param
      password: $password
      roleId: $roleId
      factory: $factory
    ) {
      success
      message
    }
  }
`);

// Omit password to keep the current one.
export const UpdateAdminDoc = graphql(/* GraphQL */ `
  mutation UpdateAdmin(
    $id: ID!
    $param: String
    $password: String
    $roleId: ID
    $factory: String
  ) {
    updateAdmin(
      id: $id
      param: $param
      password: $password
      roleId: $roleId
      factory: $factory
    ) {
      success
      message
    }
  }
`);

export const DeleteAdminDoc = graphql(/* GraphQL */ `
  mutation DeleteAdmin($id: ID!) {
    deleteAdmin(id: $id) {
      success
      message
    }
  }
`);

// Roles: admin-assembled permission sets (Систем тохиргоо › Эрх).
export const RolesDoc = graphql(/* GraphQL */ `
  query Roles {
    roles {
      success
      message
      roles {
        id
        name
        permissions
        crossFactory
        isSystem
      }
    }
  }
`);

export const PermissionCatalogDoc = graphql(/* GraphQL */ `
  query PermissionCatalog {
    permissionCatalog {
      success
      message
      groups {
        group
        items {
          key
          label
        }
      }
    }
  }
`);

export const CreateRoleDoc = graphql(/* GraphQL */ `
  mutation CreateRole(
    $name: String!
    $permissions: [PERMISSION!]!
    $crossFactory: Boolean
  ) {
    createRole(
      name: $name
      permissions: $permissions
      crossFactory: $crossFactory
    ) {
      success
      message
    }
  }
`);

export const UpdateRoleDoc = graphql(/* GraphQL */ `
  mutation UpdateRole($id: ID!, $name: String, $permissions: [PERMISSION!]) {
    updateRole(id: $id, name: $name, permissions: $permissions) {
      success
      message
    }
  }
`);

export const DeleteRoleDoc = graphql(/* GraphQL */ `
  mutation DeleteRole($id: ID!) {
    deleteRole(id: $id) {
      success
      message
    }
  }
`);
