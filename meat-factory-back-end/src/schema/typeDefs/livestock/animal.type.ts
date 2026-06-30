// The ANIMAL_TYPE enum was removed — animals are an admin-managed catalogue
// keyed by `name`.
export default `#graphql
    type Animal {
        id: ID
        # Unique catalogue name (Үхэр, Адуу, …) — the animal identity.
        name: String
        # Meat allowed on export shipments (horse only, for now).
        isExport: Boolean
        pricePerAnimal: Float
        canCoverSlaughterCost: Boolean
        # Carcass-to-saleable yield (%) applied when meat is ingested into
        # inventory. Horse 70 (bone-out); others 100.
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
        # Open to any authenticated staff — the catalogue drives the FE's
        # animal lists everywhere. Mutations stay restricted below.
        animals: AnimalsResponse @authLogin
    }

    extend type Mutation {
        # Provide id to edit (incl. rename); omit to create by name.
        upsertAnimal(
            id: ID
            name: String!
            isExport: Boolean
            pricePerAnimal: Float
            canCoverSlaughterCost: Boolean
            yieldPercent: Float
            isActive: Boolean
        ): AnimalResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }
`;
