export default `#graphql
    type Settings {
        id: ID
        meatCapacityKg: Float
        meatAlertThresholdKg: Float
        cargoCapacityKg: Float
        lastAlertedAt: Date
        lastAlertedStockKg: Float
        createdAt: Date
        updatedAt: Date
    }

    type SettingsResponse {
        success: Boolean
        message: String
        settings: Settings
    }

    extend type Query {
        # Any authenticated staff can read settings (inventory page needs the
        # cargo capacity to suggest shipments).
        settings: SettingsResponse @authLogin
    }

    extend type Mutation {
        updateSettings(
            meatCapacityKg: Float
            meatAlertThresholdKg: Float
            cargoCapacityKg: Float
        ): SettingsResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }
`;
