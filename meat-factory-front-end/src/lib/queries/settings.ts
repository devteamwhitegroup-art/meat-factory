import { graphql } from "@/lib/gql/gql";

export const SettingsDoc = graphql(/* GraphQL */ `
  query Settings {
    settings {
      success
      message
      settings {
        id
        meatCapacityKg
        exportAlertThresholdKg
        domesticAlertThresholdKg
      }
    }
  }
`);

export const UpdateSettingsDoc = graphql(/* GraphQL */ `
  mutation UpdateSettings(
    $meatCapacityKg: Float
    $exportAlertThresholdKg: Float
    $domesticAlertThresholdKg: Float
  ) {
    updateSettings(
      meatCapacityKg: $meatCapacityKg
      exportAlertThresholdKg: $exportAlertThresholdKg
      domesticAlertThresholdKg: $domesticAlertThresholdKg
    ) {
      success
      message
      settings {
        id
        meatCapacityKg
        exportAlertThresholdKg
        domesticAlertThresholdKg
      }
    }
  }
`);
