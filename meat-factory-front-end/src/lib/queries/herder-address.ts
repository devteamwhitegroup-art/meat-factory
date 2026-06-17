import { graphql } from '@/lib/gql/gql';

export const HerderAddressListDoc = graphql(/* GraphQL */ `
  query HerderAddresses($search: String, $isActive: Boolean) {
    herderAddresses(
      search: $search
      isActive: $isActive
      limit: 200
      page: 1
    ) {
      success
      message
      count
      herderAddresses {
        id
        name
        isActive
        createdAt
        updatedAt
      }
    }
  }
`);

export const CreateHerderAddressDoc = graphql(/* GraphQL */ `
  mutation CreateHerderAddress($name: String!) {
    createHerderAddress(name: $name) {
      success
      message
      herderAddress {
        id
        name
        isActive
      }
    }
  }
`);

export const UpdateHerderAddressDoc = graphql(/* GraphQL */ `
  mutation UpdateHerderAddress(
    $id: ID!
    $name: String
    $isActive: Boolean
  ) {
    updateHerderAddress(id: $id, name: $name, isActive: $isActive) {
      success
      message
      herderAddress {
        id
        name
        isActive
      }
    }
  }
`);

export const DeleteHerderAddressDoc = graphql(/* GraphQL */ `
  mutation DeleteHerderAddress($id: ID!) {
    deleteHerderAddress(id: $id) {
      success
      message
    }
  }
`);
