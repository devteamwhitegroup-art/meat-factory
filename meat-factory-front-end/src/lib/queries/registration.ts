import { graphql } from '@/lib/gql/gql';

export const RegistrationListDoc = graphql(/* GraphQL */ `
  query Registrations(
    $status: REGISTRATION_STATUS
    $herderId: ID
    $registrationNumber: Int
    $limit: Int
    $page: Int
  ) {
    registrations(
      status: $status
      herderId: $herderId
      registrationNumber: $registrationNumber
      limit: $limit
      page: $page
    ) {
      success
      message
      count
      registrations {
        id
        registrationNumber
        status
        intakeDate
        vehicleNumber
        herder {
          id
          name
        }
        animalLines {
          id
          animalType
          count
        }
      }
    }
  }
`);

export const RegistrationDetailDoc = graphql(/* GraphQL */ `
  query Registration($id: ID!) {
    registration(id: $id) {
      success
      message
      registration {
        id
        registrationNumber
        status
        intakeDate
        vehicleNumber
        stamp
        photoFileId
        photo {
          id
          url
        }
        herder {
          id
          name
          registrationNo
          phone
          bankAccount
          address
        }
        guard {
          id
          param
        }
        animalLines {
          id
          animalType
          count
        }
        weighingEntries {
          id
          animalType
          weightKg
          sequenceNo
          createdAt
          scaleOperator {
            id
            param
          }
          photo {
            id
            url
          }
        }
        byproductLogs {
          id
          byproductType
          count
          averageWeightKg
          totalWeightKg
          createdAt
          loggedBy {
            id
            param
          }
          photo {
            id
            url
          }
        }
        verification {
          id
          firstVerifierId
          firstVerifiedAt
          secondVerifierId
          secondVerifiedAt
          notes
          firstVerifier {
            id
            param
          }
          secondVerifier {
            id
            param
          }
          photo {
            id
            url
          }
        }
        settlement {
          id
          totalMeatAmount
          totalByproductAmount
          totalSlaughterCost
          grossAmount
          netPayable
          isPaid
          paidAt
          notes
          settledBy {
            id
            param
          }
          photo {
            id
            url
          }
          lines {
            id
            animalType
            receivedWeightKg
            pricePerKg
            meatAmount
            byproductAmount
            slaughterCost
          }
        }
      }
    }
  }
`);

export const CreateRegistrationDoc = graphql(/* GraphQL */ `
  mutation CreateRegistration(
    $herderId: ID!
    $vehicleNumber: String!
    $stamp: String
    $photoFileId: ID
    $intakeDate: Date
    $animalLines: [RegistrationAnimalLineInput!]!
  ) {
    createRegistration(
      herderId: $herderId
      vehicleNumber: $vehicleNumber
      stamp: $stamp
      photoFileId: $photoFileId
      intakeDate: $intakeDate
      animalLines: $animalLines
    ) {
      success
      message
      registration {
        id
        registrationNumber
        status
      }
    }
  }
`);

export const AddWeighingEntryDoc = graphql(/* GraphQL */ `
  mutation AddWeighingEntry(
    $registrationId: ID!
    $animalType: ANIMAL_TYPE!
    $weightKg: Float!
    $photoFileId: ID
  ) {
    addWeighingEntry(
      registrationId: $registrationId
      animalType: $animalType
      weightKg: $weightKg
      photoFileId: $photoFileId
    ) {
      success
      message
      weighingEntry {
        id
        animalType
        weightKg
        sequenceNo
        createdAt
      }
    }
  }
`);

export const FinishWeighingDoc = graphql(/* GraphQL */ `
  mutation FinishWeighing($registrationId: ID!) {
    finishWeighing(registrationId: $registrationId) {
      success
      message
      registration {
        id
        status
      }
    }
  }
`);

export const AddByproductLogDoc = graphql(/* GraphQL */ `
  mutation AddByproductLog(
    $registrationId: ID!
    $byproductType: BYPRODUCT_TYPE!
    $count: Int!
    $averageWeightKg: Float!
    $photoFileId: ID
  ) {
    addByproductLog(
      registrationId: $registrationId
      byproductType: $byproductType
      count: $count
      averageWeightKg: $averageWeightKg
      photoFileId: $photoFileId
    ) {
      success
      message
      byproductLog {
        id
        byproductType
        count
        averageWeightKg
        totalWeightKg
      }
    }
  }
`);

export const VerifyRegistrationDoc = graphql(/* GraphQL */ `
  mutation VerifyRegistration(
    $registrationId: ID!
    $notes: String
    $photoFileId: ID
  ) {
    verifyRegistration(
      registrationId: $registrationId
      notes: $notes
      photoFileId: $photoFileId
    ) {
      success
      message
      verification {
        id
        firstVerifierId
        firstVerifiedAt
        secondVerifierId
        secondVerifiedAt
      }
    }
  }
`);

export const CreateSettlementDoc = graphql(/* GraphQL */ `
  mutation CreateSettlement(
    $registrationId: ID!
    $lines: [SettlementLineInput!]!
    $notes: String
    $photoFileId: ID
  ) {
    createSettlement(
      registrationId: $registrationId
      lines: $lines
      notes: $notes
      photoFileId: $photoFileId
    ) {
      success
      message
      settlement {
        id
        totalMeatAmount
        totalByproductAmount
        totalSlaughterCost
        grossAmount
        netPayable
        isPaid
      }
    }
  }
`);

export const MarkSettlementPaidDoc = graphql(/* GraphQL */ `
  mutation MarkSettlementPaid($registrationId: ID!) {
    markSettlementPaid(registrationId: $registrationId) {
      success
      message
      settlement {
        id
        isPaid
        paidAt
      }
    }
  }
`);

export const CancelRegistrationDoc = graphql(/* GraphQL */ `
  mutation CancelRegistration($registrationId: ID!) {
    cancelRegistration(registrationId: $registrationId) {
      success
      message
      registration {
        id
        status
      }
    }
  }
`);
