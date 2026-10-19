import { graphql } from "@/lib/gql/gql";

export const RegistrationListDoc = graphql(/* GraphQL */ `
  query Registrations(
    $status: REGISTRATION_STATUS
    $statuses: [REGISTRATION_STATUS!]
    $herderId: ID
    $registrationCode: String
    $factory: String
    $dateRange: DateRangeInput
    $limit: Int
    $page: Int
  ) {
    registrations(
      status: $status
      statuses: $statuses
      herderId: $herderId
      registrationCode: $registrationCode
      factory: $factory
      dateRange: $dateRange
      limit: $limit
      page: $page
    ) {
      success
      message
      count
      registrations {
        id
        registrationCode
        status
        factory
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
        registrationCode
        status
        factory
        intakeDate
        createdAt
        vehicleNumber
        stamp
        medicalNumbers {
          id
          number
          status
          checkedAt
        }
        medicalNumberApproved
        agreementSignatureFileId
        agreementSignature {
          id
          url
        }
        photoFileId
        photo {
          id
          url
        }
        signatureFileId
        signature {
          id
          url
        }
        stampFileId
        stampImage {
          id
          url
        }
        herder {
          id
          name
          registrationNo
          phone
          bankAccount
          bankName
          accountHolderName
          addressId
          address
        }
        editableByMe
        guard {
          id
          param
        }
        animalLines {
          id
          animalType
          count
          slaughterCost
        }
        weighingEntries {
          id
          animalType
          weightKg
          pricePerKg
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
        weighingAuditLog {
          id
          weighingEntryId
          action
          weightKgBefore
          weightKgAfter
          pricePerKgBefore
          pricePerKgAfter
          createdAt
          actor {
            id
            param
          }
        }
        byproductBundles {
          id
          wrapperId
          constantId
          name
          animalType
          count
          herderCount
          unitPrice
        }
        verification {
          id
          firstVerifierId
          firstVerifiedAt
          notes
          firstVerifier {
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
          heldAmount
          paidAmount
          heldReleasedAt
          payoutBankAccount
          payoutBankName
          payoutAccountHolderName
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
          storekeeperSignatureFileId
          storekeeperSignature {
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
          paymentProofs {
            id
            sequenceNo
            note
            createdAt
            file {
              id
              url
            }
            createdBy {
              id
              param
            }
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
    $medicalNumbers: [String!]
    $photoFileId: ID
    $signatureFileId: ID
    $stampFileId: ID
    $intakeDate: Date
    $factory: String
    $animalLines: [RegistrationAnimalLineInput!]!
    $weighings: [IntakeWeighingInput!]
  ) {
    createRegistration(
      herderId: $herderId
      vehicleNumber: $vehicleNumber
      stamp: $stamp
      medicalNumbers: $medicalNumbers
      photoFileId: $photoFileId
      signatureFileId: $signatureFileId
      stampFileId: $stampFileId
      intakeDate: $intakeDate
      factory: $factory
      animalLines: $animalLines
      weighings: $weighings
    ) {
      success
      message
      registration {
        id
        registrationCode
        status
        factory
      }
    }
  }
`);

export const AddWeighingEntryDoc = graphql(/* GraphQL */ `
  mutation AddWeighingEntry(
    $registrationId: ID!
    $animalType: String!
    $weightKg: Float!
    $pricePerKg: Float
    $photoFileId: ID
  ) {
    addWeighingEntry(
      registrationId: $registrationId
      animalType: $animalType
      weightKg: $weightKg
      pricePerKg: $pricePerKg
      photoFileId: $photoFileId
    ) {
      success
      message
      weighingEntry {
        id
        animalType
        weightKg
        pricePerKg
        sequenceNo
        createdAt
      }
    }
  }
`);

export const UpdateWeighingEntryDoc = graphql(/* GraphQL */ `
  mutation UpdateWeighingEntry(
    $id: ID!
    $weightKg: Float
    $pricePerKg: Float
    $animalType: String
    $photoFileId: ID
  ) {
    updateWeighingEntry(
      id: $id
      weightKg: $weightKg
      pricePerKg: $pricePerKg
      animalType: $animalType
      photoFileId: $photoFileId
    ) {
      success
      message
      weighingEntry {
        id
        animalType
        weightKg
        pricePerKg
        sequenceNo
      }
    }
  }
`);

export const DeleteWeighingEntryDoc = graphql(/* GraphQL */ `
  mutation DeleteWeighingEntry($id: ID!) {
    deleteWeighingEntry(id: $id) {
      success
      message
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

export const SetRegistrationByproductsDoc = graphql(/* GraphQL */ `
  mutation SetRegistrationByproducts(
    $registrationId: ID!
    $bundles: [ByproductBundleInput!]!
  ) {
    setRegistrationByproducts(
      registrationId: $registrationId
      bundles: $bundles
    ) {
      success
      message
      registration {
        id
        status
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
    $payoutBankAccount: String
    $payoutBankName: String
    $payoutAccountHolderName: String
  ) {
    createSettlement(
      registrationId: $registrationId
      lines: $lines
      notes: $notes
      photoFileId: $photoFileId
      payoutBankAccount: $payoutBankAccount
      payoutBankName: $payoutBankName
      payoutAccountHolderName: $payoutAccountHolderName
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
        payoutBankAccount
        payoutBankName
        payoutAccountHolderName
        isPaid
      }
    }
  }
`);

export const MarkSettlementPaidDoc = graphql(/* GraphQL */ `
  mutation MarkSettlementPaid($registrationId: ID!, $heldAmount: Float) {
    markSettlementPaid(
      registrationId: $registrationId
      heldAmount: $heldAmount
    ) {
      success
      message
      settlement {
        id
        isPaid
        paidAt
        heldAmount
        paidAmount
        heldReleasedAt
      }
    }
  }
`);

export const ReleaseSettlementHoldDoc = graphql(/* GraphQL */ `
  mutation ReleaseSettlementHold($registrationId: ID!) {
    releaseSettlementHold(registrationId: $registrationId) {
      success
      message
      settlement {
        id
        isPaid
        paidAt
        heldAmount
        paidAmount
        heldReleasedAt
      }
    }
  }
`);

export const AddSettlementPaymentProofDoc = graphql(/* GraphQL */ `
  mutation AddSettlementPaymentProof(
    $registrationId: ID!
    $fileId: ID!
    $note: String
  ) {
    addSettlementPaymentProof(
      registrationId: $registrationId
      fileId: $fileId
      note: $note
    ) {
      success
      message
      proof {
        id
        sequenceNo
        note
        createdAt
        file {
          id
          url
        }
        createdBy {
          id
          param
        }
      }
    }
  }
`);

export const RemoveSettlementPaymentProofDoc = graphql(/* GraphQL */ `
  mutation RemoveSettlementPaymentProof($id: ID!) {
    removeSettlementPaymentProof(id: $id) {
      success
      message
    }
  }
`);

export const SetSettlementStorekeeperSignatureDoc = graphql(/* GraphQL */ `
  mutation SetSettlementStorekeeperSignature(
    $registrationId: ID!
    $fileId: ID
  ) {
    setSettlementStorekeeperSignature(
      registrationId: $registrationId
      fileId: $fileId
    ) {
      success
      message
      settlement {
        id
        storekeeperSignatureFileId
        storekeeperSignature {
          id
          url
        }
      }
    }
  }
`);

// Intake fix: directly (same day / admin) or as a request to admin.
export const UpdateRegistrationDoc = graphql(/* GraphQL */ `
  mutation UpdateRegistration(
    $id: ID!
    $herderId: ID!
    $vehicleNumber: String!
    $stamp: String
    $animalLines: [RegistrationAnimalLineInput!]!
  ) {
    updateRegistration(
      id: $id
      herderId: $herderId
      vehicleNumber: $vehicleNumber
      stamp: $stamp
      animalLines: $animalLines
    ) {
      success
      message
    }
  }
`);

export const RequestRegistrationChangeDoc = graphql(/* GraphQL */ `
  mutation RequestRegistrationChange(
    $registrationId: ID!
    $intake: RegistrationIntakeInput
    $weights: [WeightChangeInput!]
    $added: [WeighingAddInput!]
    $reason: String!
  ) {
    requestRegistrationChange(
      registrationId: $registrationId
      intake: $intake
      weights: $weights
      added: $added
      reason: $reason
    ) {
      success
      message
    }
  }
`);

export const ReviewRegistrationChangeDoc = graphql(/* GraphQL */ `
  mutation ReviewRegistrationChange(
    $id: ID!
    $approve: Boolean!
    $note: String
  ) {
    reviewRegistrationChange(id: $id, approve: $approve, note: $note) {
      success
      message
    }
  }
`);

export const RegistrationChangeRequestsDoc = graphql(/* GraphQL */ `
  query RegistrationChangeRequests(
    $status: CHANGE_REQUEST_STATUS
    $registrationId: ID
    $limit: Int
    $page: Int
  ) {
    registrationChangeRequests(
      status: $status
      registrationId: $registrationId
      limit: $limit
      page: $page
    ) {
      success
      message
      count
      changeRequests {
        id
        reason
        status
        reviewNote
        reviewedAt
        createdAt
        requestedBy {
          id
          param
        }
        reviewedBy {
          id
          param
        }
        changes {
          intake {
            vehicleNumber
            stamp
            herder {
              id
              name
              registrationNo
            }
            animalLines {
              animalType
              count
            }
          }
          weights {
            weightKg
            pricePerKg
            entry {
              id
              sequenceNo
              animalType
              weightKg
              pricePerKg
            }
          }
          added {
            animalType
            weightKg
            pricePerKg
          }
        }
        registration {
          id
          registrationCode
          factory
          vehicleNumber
          stamp
          herder {
            id
            name
            registrationNo
          }
          animalLines {
            id
            animalType
            count
          }
        }
      }
    }
  }
`);
