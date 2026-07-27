export default `#graphql
    type Settings {
        id: ID
        meatCapacityKg: Float
        exportAlertThresholdKg: Float
        domesticAlertThresholdKg: Float
        createdAt: Date
        updatedAt: Date
    }

    type SettingsResponse {
        success: Boolean
        message: String
        settings: Settings
    }

    extend type Query {
        settings: SettingsResponse @authLogin
    }

    extend type Mutation {
        updateSettings(
            meatCapacityKg: Float
            exportAlertThresholdKg: Float
            domesticAlertThresholdKg: Float
        ): SettingsResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }
`;
