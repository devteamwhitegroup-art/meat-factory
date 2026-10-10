import { graphql } from "@/lib/gql/gql";

// Vet worklist — every medical number with its registration + herder.
export const MedicalNumbersDoc = graphql(/* GraphQL */ `
  query MedicalNumbers(
    $status: MEDICAL_NUMBER_STATUS
    $number: String
    $factory: FACTORY
    $limit: Int
    $page: Int
  ) {
    medicalNumbers(
      status: $status
      number: $number
      factory: $factory
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
