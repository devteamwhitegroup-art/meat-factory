import { graphql } from "@/lib/gql/gql";

export const ByproductWrapperListDoc = graphql(/* GraphQL */ `
  query ByproductWrappers($animalType: String, $isActive: Boolean) {
    byproductWrappers(
      animalType: $animalType
      isActive: $isActive
      limit: 200
      page: 1
    ) {
      success
      message
      count
      byproductWrappers {
        id
        animalId
        animalType
        animal {
          id
          name
        }
        name
        price
        isActive
        items {
          id
          wrapperId
          name
          quantityPerAnimal
          unitWeightKg
          isActive
        }
      }
    }
  }
`);

export const CreateByproductWrapperDoc = graphql(/* GraphQL */ `
  mutation CreateByproductWrapper(
    $animalType: String!
    $name: String!
    $price: Float
  ) {
    createByproductWrapper(animalType: $animalType, name: $name, price: $price) {
      success
      message
      byproductWrapper {
        id
      }
    }
  }
`);

export const UpdateByproductWrapperDoc = graphql(/* GraphQL */ `
  mutation UpdateByproductWrapper(
    $id: ID!
    $name: String
    $price: Float
    $isActive: Boolean
  ) {
    updateByproductWrapper(
      id: $id
      name: $name
      price: $price
      isActive: $isActive
    ) {
      success
      message
      byproductWrapper {
        id
      }
    }
  }
`);

export const DeleteByproductWrapperDoc = graphql(/* GraphQL */ `
  mutation DeleteByproductWrapper($id: ID!) {
    deleteByproductWrapper(id: $id) {
      success
      message
    }
  }
`);
