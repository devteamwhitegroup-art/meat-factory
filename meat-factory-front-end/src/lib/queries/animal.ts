import { graphql } from "@/lib/gql/gql";

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
        name
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
    $name: String
    $pricePerAnimal: Float
    $canCoverSlaughterCost: Boolean
    $isActive: Boolean
  ) {
    upsertAnimal(
      animalType: $animalType
      name: $name
      pricePerAnimal: $pricePerAnimal
      canCoverSlaughterCost: $canCoverSlaughterCost
      isActive: $isActive
    ) {
      success
      message
      animal {
        id
        animalType
        name
        pricePerAnimal
        canCoverSlaughterCost
        isActive
      }
    }
  }
`);
