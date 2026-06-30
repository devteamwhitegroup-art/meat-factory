import { graphql } from "@/lib/gql/gql";

export const SettingsDoc = graphql(/* GraphQL */ `
  query Settings {
    settings {
      success
      message
      settings {
        id
        meatCapacityKg
        meatAlertThresholdKg
        cargoCapacityKg
        lastAlertedAt
      }
    }
  }
`);

export const UpdateSettingsDoc = graphql(/* GraphQL */ `
  mutation UpdateSettings(
    $meatCapacityKg: Float
    $meatAlertThresholdKg: Float
    $cargoCapacityKg: Float
  ) {
    updateSettings(
      meatCapacityKg: $meatCapacityKg
      meatAlertThresholdKg: $meatAlertThresholdKg
      cargoCapacityKg: $cargoCapacityKg
    ) {
      success
      message
      settings {
        id
        meatCapacityKg
        meatAlertThresholdKg
        cargoCapacityKg
      }
    }
  }
`);
