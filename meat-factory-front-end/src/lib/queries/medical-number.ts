import { graphql } from "@/lib/gql/gql";

// Vet worklist — every medical number with its registration + herder.
export const MedicalNumbersDoc = graphql(/* GraphQL */ `
  query MedicalNumbers(
    $status: MEDICAL_NUMBER_STATUS
    $number: String
    $factory: String
    $dateRange: DateRangeInput
    $limit: Int
    $page: Int
  ) {
    medicalNumbers(
      status: $status
      number: $number
      factory: $factory
      dateRange: $dateRange
      limit: $limit
      page: $page
    ) {
      success
      message
      count
      medicalNumbers {
        id
        number
        status
        checkedAt
        createdAt
        checkedBy {
          id
          param
        }
        registration {
          id
          registrationCode
          intakeDate
          factory
          herder {
            id
            name
            phone
          }
        }
      }
    }
  }
`);

// Head brought in per animal — same factory/date scope as the list.
export const MedicalAnimalCountsDoc = graphql(/* GraphQL */ `
  query MedicalAnimalCounts($factory: String, $dateRange: DateRangeInput) {
    medicalAnimalCounts(factory: $factory, dateRange: $dateRange) {
      success
      message
      items {
        animalType
        count
      }
    }
  }
`);

export const AddMedicalNumberDoc = graphql(/* GraphQL */ `
  mutation AddMedicalNumber($registrationId: ID!, $number: String!) {
    addMedicalNumber(registrationId: $registrationId, number: $number) {
      success
      message
    }
  }
`);

export const RemoveMedicalNumberDoc = graphql(/* GraphQL */ `
  mutation RemoveMedicalNumber($id: ID!) {
    removeMedicalNumber(id: $id) {
      success
      message
    }
  }
`);

export const SetMedicalNumberStatusDoc = graphql(/* GraphQL */ `
  mutation SetMedicalNumberStatus($id: ID!, $status: MEDICAL_NUMBER_STATUS!) {
    setMedicalNumberStatus(id: $id, status: $status) {
      success
      message
      medicalNumber {
        id
        status
        checkedAt
      }
    }
  }
`);
