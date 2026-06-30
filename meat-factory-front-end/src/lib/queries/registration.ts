import { graphql } from "@/lib/gql/gql";

export const RegistrationListDoc = graphql(/* GraphQL */ `
  query Registrations(
    $status: REGISTRATION_STATUS
    $statuses: [REGISTRATION_STATUS!]
    $herderId: ID
    $registrationCode: String
    $dateRange: DateRangeInput
    $limit: Int
    $page: Int
  ) {
    registrations(
      status: $status
      statuses: $statuses
      herderId: $herderId
      registrationCode: $registrationCode
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
        intakeDate
        vehicleNumber
        stamp
        medicalNumber
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
        byproductLogs {
          id
          name
          animalType
          canCoverSlaughterCost
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
          notes
          slaughterCoveredByByproduct
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
    $medicalNumber: String
    $photoFileId: ID
    $signatureFileId: ID
    $stampFileId: ID
    $intakeDate: Date
    $isPreButchered: Boolean
    $animalLines: [RegistrationAnimalLineInput!]!
  ) {
    createRegistration(
      herderId: $herderId
      vehicleNumber: $vehicleNumber
      stamp: $stamp
      medicalNumber: $medicalNumber
      photoFileId: $photoFileId
      signatureFileId: $signatureFileId
      stampFileId: $stampFileId
      intakeDate: $intakeDate
      isPreButchered: $isPreButchered
      animalLines: $animalLines
    ) {
      success
      message
      registration {
        id
        registrationCode
        status
        isPreButchered
      }
    }
  }
`);

export const AddWeighingEntryDoc = graphql(/* GraphQL */ `
  mutation AddWeighingEntry(
    $registrationId: ID!
    $animalType: ANIMAL_TYPE!
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
    $animalType: ANIMAL_TYPE
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

export const DerivedByproductsDoc = graphql(/* GraphQL */ `
  query DerivedByproducts($registrationId: ID!) {
    derivedByproducts(registrationId: $registrationId) {
      success
      message
      items {
        animalType
        wrapperName
        name
        quantity
        unitWeightKg
        weightKg
        canCoverSlaughterCost
      }
    }
  }
`);

export const SetRegistrationByproductsDoc = graphql(/* GraphQL */ `
  mutation SetRegistrationByproducts(
    $registrationId: ID!
    $items: [ByproductItemInput!]!
  ) {
    setRegistrationByproducts(registrationId: $registrationId, items: $items) {
      success
      message
      registration {
        id
        status
      }
    }
  }
`);

export const SetSlaughterCoveredDoc = graphql(/* GraphQL */ `
  mutation SetSlaughterCovered($registrationId: ID!, $covered: Boolean!) {
    setSlaughterCovered(registrationId: $registrationId, covered: $covered) {
      success
      message
      verification {
        id
        slaughterCoveredByByproduct
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

export const ApproveMedicalNumberDoc = graphql(/* GraphQL */ `
  mutation ApproveMedicalNumber($registrationId: ID!, $medicalNumber: String) {
    approveMedicalNumber(
      registrationId: $registrationId
      medicalNumber: $medicalNumber
    ) {
      success
      message
      registration {
        id
        medicalNumber
        medicalNumberApproved
        status
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

export const SetRegistrationSlaughterCostsDoc = graphql(/* GraphQL */ `
  mutation SetRegistrationSlaughterCosts(
    $registrationId: ID!
    $lines: [SlaughterCostInput!]!
  ) {
    setRegistrationSlaughterCosts(
      registrationId: $registrationId
      lines: $lines
    ) {
      success
      message
      registration {
        id
        status
        animalLines {
          id
          animalType
          slaughterCost
        }
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

export const SetRegistrationAgreementSignatureDoc = graphql(/* GraphQL */ `
  mutation SetRegistrationAgreementSignature(
    $registrationId: ID!
    $fileId: ID
  ) {
    setRegistrationAgreementSignature(
      registrationId: $registrationId
      fileId: $fileId
    ) {
      success
      message
      registration {
        id
        agreementSignatureFileId
        agreementSignature {
          id
          url
        }
      }
    }
  }
`);
