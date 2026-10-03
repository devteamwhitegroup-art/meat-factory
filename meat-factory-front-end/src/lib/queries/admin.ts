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
        role
      }
    }
  }
`);

export const CreateAdminDoc = graphql(/* GraphQL */ `
  mutation CreateAdmin($param: String!, $password: String!, $role: ADMIN_ROLE) {
    createAdmin(param: $param, password: $password, role: $role) {
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
    $role: ADMIN_ROLE
  ) {
    updateAdmin(id: $id, param: $param, password: $password, role: $role) {
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
