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
          canCoverSlaughterCost
        }
        name
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
  mutation CreateByproductWrapper($animalType: String!, $name: String!) {
    createByproductWrapper(animalType: $animalType, name: $name) {
      success
      message
      byproductWrapper {
        id
      }
    }
  }
`);

export const UpdateByproductWrapperDoc = graphql(/* GraphQL */ `
  mutation UpdateByproductWrapper($id: ID!, $name: String, $isActive: Boolean) {
    updateByproductWrapper(id: $id, name: $name, isActive: $isActive) {
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
