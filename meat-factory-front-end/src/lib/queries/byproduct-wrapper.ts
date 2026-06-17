import { graphql } from '@/lib/gql/gql';

export const ByproductWrapperListDoc = graphql(/* GraphQL */ `
  query ByproductWrappers($animalType: ANIMAL_TYPE, $isActive: Boolean) {
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
          animalType
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
  mutation CreateByproductWrapper(
    $animalType: ANIMAL_TYPE!
    $name: String!
  ) {
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
  mutation UpdateByproductWrapper(
    $id: ID!
    $name: String
    $isActive: Boolean
  ) {
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
