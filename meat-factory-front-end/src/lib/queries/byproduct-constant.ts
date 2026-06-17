import { graphql } from '@/lib/gql/gql';

export const CreateByproductConstantDoc = graphql(/* GraphQL */ `
  mutation CreateByproductConstant(
    $wrapperId: ID!
    $name: String!
    $quantityPerAnimal: Int!
    $unitWeightKg: Float
  ) {
    createByproductConstant(
      wrapperId: $wrapperId
      name: $name
      quantityPerAnimal: $quantityPerAnimal
      unitWeightKg: $unitWeightKg
    ) {
      success
      message
      byproductConstant {
        id
      }
    }
  }
`);

export const UpdateByproductConstantDoc = graphql(/* GraphQL */ `
  mutation UpdateByproductConstant(
    $id: ID!
    $name: String
    $quantityPerAnimal: Int
    $unitWeightKg: Float
    $isActive: Boolean
  ) {
    updateByproductConstant(
      id: $id
      name: $name
      quantityPerAnimal: $quantityPerAnimal
      unitWeightKg: $unitWeightKg
      isActive: $isActive
    ) {
      success
      message
      byproductConstant {
        id
      }
    }
  }
`);

export const DeleteByproductConstantDoc = graphql(/* GraphQL */ `
  mutation DeleteByproductConstant($id: ID!) {
    deleteByproductConstant(id: $id) {
      success
      message
    }
  }
`);
