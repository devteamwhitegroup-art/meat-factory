export default `#graphql
    type Printer {
        id: ID
        name: String
        ip: String
    }

    input PrinterInput {
        # Omit for a new printer; send the existing id to keep it.
        id: ID
        name: String!
        ip: String!
    }

    type Settings {
        id: ID
        meatCapacityKg: Float
        exportAlertThresholdKg: Float
        domesticAlertThresholdKg: Float
        printers: [Printer]
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
            # Replaces the whole printer list.
            printers: [PrinterInput!]
        ): SettingsResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }
`;
