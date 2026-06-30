// ANIMAL_TYPE declared once in registration.type.ts — do not redeclare.
export default `#graphql
    type Animal {
        id: ID
        animalType: ANIMAL_TYPE
        # Mongolian display name (Үхэр, Хонь, …). Catalogue source of truth.
        name: String
        pricePerAnimal: Float
        canCoverSlaughterCost: Boolean
        # Carcass-to-saleable yield (%) applied when meat is ingested into
        # inventory. Horse seeds at 70 (bone-out); everything else 100.
        yieldPercent: Float
        isActive: Boolean
        createdAt: Date
        updatedAt: Date
    }

    type AnimalResponse {
        success: Boolean
        message: String
        animal: Animal
    }

    type AnimalsResponse {
        success: Boolean
        message: String
        animals: [Animal]
    }

    extend type Query {
        # Open to any authenticated staff — the catalog drives the FE's animal
        # type lists (intake grid, weighing, settlement, sales, etc.) so every
        # role needs to read it. Mutations stay restricted below.
        animals: AnimalsResponse @authLogin
    }

    extend type Mutation {
        upsertAnimal(
            animalType: ANIMAL_TYPE!
            name: String
            pricePerAnimal: Float
            canCoverSlaughterCost: Boolean
            yieldPercent: Float
            isActive: Boolean
        ): AnimalResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }
`;
