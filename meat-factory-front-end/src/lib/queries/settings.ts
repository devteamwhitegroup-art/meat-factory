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
        exportAlertThresholdKg
        domesticAlertThresholdKg
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
    $exportAlertThresholdKg: Float
    $domesticAlertThresholdKg: Float
  ) {
    updateSettings(
      meatCapacityKg: $meatCapacityKg
      meatAlertThresholdKg: $meatAlertThresholdKg
      cargoCapacityKg: $cargoCapacityKg
      exportAlertThresholdKg: $exportAlertThresholdKg
      domesticAlertThresholdKg: $domesticAlertThresholdKg
    ) {
      success
      message
      settings {
        id
        meatCapacityKg
        meatAlertThresholdKg
        cargoCapacityKg
        exportAlertThresholdKg
        domesticAlertThresholdKg
      }
    }
  }
`);
