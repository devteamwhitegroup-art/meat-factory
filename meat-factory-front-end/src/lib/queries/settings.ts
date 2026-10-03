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
        printers {
          id
          name
          ip
        }
      }
    }
  }
`);

export const UpdateSettingsDoc = graphql(/* GraphQL */ `
  mutation UpdateSettings(
    $meatCapacityKg: Float
    $exportAlertThresholdKg: Float
    $domesticAlertThresholdKg: Float
    $printers: [PrinterInput!]
  ) {
    updateSettings(
      meatCapacityKg: $meatCapacityKg
      exportAlertThresholdKg: $exportAlertThresholdKg
      domesticAlertThresholdKg: $domesticAlertThresholdKg
      printers: $printers
    ) {
      success
      message
      settings {
        id
        meatCapacityKg
        exportAlertThresholdKg
        domesticAlertThresholdKg
        printers {
          id
          name
          ip
        }
      }
    }
  }
`);
