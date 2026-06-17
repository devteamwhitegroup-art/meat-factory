import { graphql } from '@/lib/gql/gql';

// Top-level per-animal-type config: butcher cost + canCoverSlaughterCost.
// Pre-fills settlement slaughter cost and drives the byproduct ownership rule
// (false → factory storage; true → herder may keep unless cover is toggled).
export const AnimalListDoc = graphql(/* GraphQL */ `
  query Animals {
    animals {
      success
      message
      animals {
        id
        animalType
        pricePerAnimal
        canCoverSlaughterCost
        isActive
      }
    }
  }
`);

export const UpsertAnimalDoc = graphql(/* GraphQL */ `
  mutation UpsertAnimal(
    $animalType: ANIMAL_TYPE!
    $pricePerAnimal: Float
    $canCoverSlaughterCost: Boolean
    $isActive: Boolean
  ) {
    upsertAnimal(
      animalType: $animalType
      pricePerAnimal: $pricePerAnimal
      canCoverSlaughterCost: $canCoverSlaughterCost
      isActive: $isActive
    ) {
      success
      message
      animal {
        id
        animalType
        pricePerAnimal
        canCoverSlaughterCost
        isActive
      }
    }
  }
`);
