import { graphql } from "@/lib/gql/gql";

// Animal catalogue — admin-managed, keyed by `name` (the Mongolian display
// name, which is also the value stored as `animalType` on every other record).
// Drives intake/weigh/sales/cargo pickers, бой cost prefill and the byproduct
// ownership rule (canCoverSlaughterCost). `isExport` gates export-shipment cargo.
export const AnimalListDoc = graphql(/* GraphQL */ `
  query Animals {
    animals {
      success
      message
      animals {
        id
        name
        isExport
        pricePerAnimal
        canCoverSlaughterCost
        yieldPercent
        isActive
      }
    }
  }
`);

// Create (omit id) or edit/rename (pass id) a catalogue animal.
export const UpsertAnimalDoc = graphql(/* GraphQL */ `
  mutation UpsertAnimal(
    $id: ID
    $name: String!
    $isExport: Boolean
    $pricePerAnimal: Float
    $canCoverSlaughterCost: Boolean
    $yieldPercent: Float
    $isActive: Boolean
  ) {
    upsertAnimal(
      id: $id
      name: $name
      isExport: $isExport
      pricePerAnimal: $pricePerAnimal
      canCoverSlaughterCost: $canCoverSlaughterCost
      yieldPercent: $yieldPercent
      isActive: $isActive
    ) {
      success
      message
      animal {
        id
        name
        isExport
        pricePerAnimal
        canCoverSlaughterCost
        yieldPercent
        isActive
      }
    }
  }
`);
