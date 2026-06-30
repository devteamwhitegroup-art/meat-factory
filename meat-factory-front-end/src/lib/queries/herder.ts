import { graphql } from "@/lib/gql/gql";

export const HerderListDoc = graphql(/* GraphQL */ `
  query Herders($search: String, $limit: Int, $page: Int) {
    herders(search: $search, limit: $limit, page: $page) {
      success
      message
      count
      herders {
        id
        name
        registrationNo
        phone
        bankAccount
        bankName
        accountHolderName
        addressId
        address
        addressEntry {
          id
          name
        }
        createdAt
      }
    }
  }
`);

export const HerderDoc = graphql(/* GraphQL */ `
  query Herder($id: ID!) {
    herder(id: $id) {
      success
      message
      herder {
        id
        name
        registrationNo
        phone
        bankAccount
        bankName
        accountHolderName
        addressId
        address
        addressEntry {
          id
          name
        }
        createdAt
        registrations {
          id
          registrationCode
          status
          intakeDate
        }
      }
    }
  }
`);

export const CreateHerderDoc = graphql(/* GraphQL */ `
  mutation CreateHerder(
    $name: String!
    $registrationNo: String!
    $phone: String
    $bankAccount: String
    $bankName: String
    $accountHolderName: String
    $addressId: ID
    $address: String
  ) {
    createHerder(
      name: $name
      registrationNo: $registrationNo
      phone: $phone
      bankAccount: $bankAccount
      bankName: $bankName
      accountHolderName: $accountHolderName
      addressId: $addressId
      address: $address
    ) {
      success
      message
      herder {
        id
        name
        registrationNo
        phone
        bankAccount
        bankName
        accountHolderName
        addressId
        address
        addressEntry {
          id
          name
        }
      }
    }
  }
`);

export const UpdateHerderDoc = graphql(/* GraphQL */ `
  mutation UpdateHerder(
    $id: ID!
    $name: String
    $registrationNo: String
    $phone: String
    $bankAccount: String
    $bankName: String
    $accountHolderName: String
    $addressId: ID
    $address: String
  ) {
    updateHerder(
      id: $id
      name: $name
      registrationNo: $registrationNo
      phone: $phone
      bankAccount: $bankAccount
      bankName: $bankName
      accountHolderName: $accountHolderName
      addressId: $addressId
      address: $address
    ) {
      success
      message
      herder {
        id
        name
        registrationNo
        phone
        bankAccount
        bankName
        accountHolderName
        addressId
        address
        addressEntry {
          id
          name
        }
      }
    }
  }
`);

export const DeleteHerderDoc = graphql(/* GraphQL */ `
  mutation DeleteHerder($id: ID!) {
    deleteHerder(id: $id) {
      success
      message
    }
  }
`);
