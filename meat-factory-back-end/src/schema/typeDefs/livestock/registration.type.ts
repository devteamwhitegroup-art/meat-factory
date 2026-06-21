import {
  ANIMAL_TYPE,
  BYPRODUCT_TYPE,
  REGISTRATION_STATUS,
} from "../../../types/livestock/registration.type";
import { PaginationSchema } from "../global/global.type";

export default `#graphql
    enum ANIMAL_TYPE {
        ${Object.values(ANIMAL_TYPE).join("\n ")}
    }

    enum BYPRODUCT_TYPE {
        ${Object.values(BYPRODUCT_TYPE).join("\n ")}
    }

    enum REGISTRATION_STATUS {
        ${Object.values(REGISTRATION_STATUS).join("\n ")}
    }

    type RegistrationAnimalLine {
        id: ID
        registrationId: ID
        # animalId is the FK; animalType is resolved through the joined Animal
        # so existing consumers stay unchanged.
        animalId: ID
        animal: Animal
        animalType: ANIMAL_TYPE
        count: Int
        createdAt: Date
        updatedAt: Date
    }

    type WeighingEntry {
        id: ID
        registrationId: ID
        animalId: ID
        animal: Animal
        animalType: ANIMAL_TYPE
        weightKg: Float
        pricePerKg: Float
        sequenceNo: Int
        scaleOperatorId: ID
        scaleOperator: Admin
        photoFileId: ID
        photo: File
        createdAt: Date
        updatedAt: Date
    }

    type ByproductLog {
        id: ID
        registrationId: ID
        name: String
        animalId: ID
        animal: Animal
        animalType: ANIMAL_TYPE
        canCoverSlaughterCost: Boolean
        count: Int
        averageWeightKg: Float
        totalWeightKg: Float
        loggedById: ID
        loggedBy: Admin
        photoFileId: ID
        photo: File
        createdAt: Date
        updatedAt: Date
    }

    type DerivedByproduct {
        animalType: ANIMAL_TYPE
        wrapperId: ID
        wrapperName: String
        name: String
        quantity: Int
        unitWeightKg: Float
        weightKg: Float
        canCoverSlaughterCost: Boolean
    }

    type DerivedByproductsResponse {
        success: Boolean
        message: String
        items: [DerivedByproduct]
    }

    input ByproductItemInput {
        name: String!
        animalType: ANIMAL_TYPE
        quantity: Int!
        weightKg: Float
        canCoverSlaughterCost: Boolean
    }

    type ByproductHandoffItem {
        animalType: ANIMAL_TYPE
        name: String
        totalQuantity: Int
        totalWeightKg: Float
    }

    type ByproductHandoffResponse {
        success: Boolean
        message: String
        items: [ByproductHandoffItem]
    }

    type Verification {
        id: ID
        registrationId: ID
        firstVerifierId: ID
        firstVerifier: Admin
        firstVerifiedAt: Date
        notes: String
        photoFileId: ID
        photo: File
        slaughterCoveredByByproduct: Boolean
        createdAt: Date
        updatedAt: Date
    }

    type SettlementLine {
        id: ID
        settlementId: ID
        animalId: ID
        animal: Animal
        animalType: ANIMAL_TYPE
        receivedWeightKg: Float
        pricePerKg: Float
        meatAmount: Float
        byproductAmount: Float
        slaughterCost: Float
        createdAt: Date
        updatedAt: Date
    }

    type Settlement {
        id: ID
        registrationId: ID
        totalMeatAmount: Float
        totalByproductAmount: Float
        totalSlaughterCost: Float
        grossAmount: Float
        netPayable: Float
        # Per-settlement payout override. When set, takes precedence over
        # the herder's default bank fields on this payout only.
        payoutBankAccount: String
        payoutBankName: String
        payoutAccountHolderName: String
        isPaid: Boolean
        paidAt: Date
        settledById: ID
        settledBy: Admin
        notes: String
        photoFileId: ID
        photo: File
        lines: [SettlementLine]
        createdAt: Date
        updatedAt: Date
    }

    type Registration {
        id: ID
        registrationNumber: Int
        herderId: ID
        herder: Herder
        vehicleNumber: String
        stamp: String
        medicalNumber: String
        photoFileId: ID
        photo: File
        signatureFileId: ID
        signature: File
        stampFileId: ID
        stampImage: File
        intakeDate: Date
        guardId: ID
        guard: Admin
        status: REGISTRATION_STATUS
        # Pre-butchered intake — herder delivered ready-cut meat. Slaughter
        # cost stays 0 at settlement and the byproduct-cover toggle is hidden.
        isPreButchered: Boolean
        animalLines: [RegistrationAnimalLine]
        weighingEntries: [WeighingEntry]
        byproductLogs: [ByproductLog]
        verification: Verification
        settlement: Settlement
        createdAt: Date
        updatedAt: Date
    }

    type RegistrationResponse {
        success: Boolean
        message: String
        registration: Registration
    }

    type NextRegistrationNumberResponse {
        success: Boolean
        message: String
        registrationNumber: Int
    }

    type RegistrationsResponse {
        success: Boolean
        message: String
        registrations: [Registration]
        count: Int
    }

    type WeighingEntryResponse {
        success: Boolean
        message: String
        weighingEntry: WeighingEntry
    }

    type VerificationResponse {
        success: Boolean
        message: String
        verification: Verification
    }

    type SettlementResponse {
        success: Boolean
        message: String
        settlement: Settlement
    }

    input RegistrationAnimalLineInput {
        animalType: ANIMAL_TYPE!
        count: Int!
    }

    input SettlementLineInput {
        animalType: ANIMAL_TYPE!
        slaughterCost: Float
    }

    extend type Query {
        registrations(
            status: REGISTRATION_STATUS
            # Optional set filter: list rows whose status is IN this set.
            # Used by the FE "stage" chips (e.g. WEIGHED+VERIFIED).
            statuses: [REGISTRATION_STATUS!]
            herderId: ID
            registrationNumber: Int
            dateRange: DateRangeInput
            ${PaginationSchema}
        ): RegistrationsResponse @authLogin
        registration(id: ID!): RegistrationResponse @authLogin
        nextRegistrationNumber: NextRegistrationNumberResponse @auth(permissions: ["GUARD", "STOREKEEPER", "MANAGER", "SCALE", "ADMIN", "SUPER_ADMIN"])
        derivedByproducts(registrationId: ID!): DerivedByproductsResponse @auth(permissions: ["STOREKEEPER", "MANAGER", "ADMIN", "SUPER_ADMIN"])
        byproductHandoff(dateRange: DateRangeInput): ByproductHandoffResponse @auth(permissions: ["STOREKEEPER", "MANAGER", "ADMIN", "SUPER_ADMIN"])
    }

    extend type Mutation {
        createRegistration(
            herderId: ID!
            vehicleNumber: String!
            stamp: String
            medicalNumber: String
            photoFileId: ID
            signatureFileId: ID
            stampFileId: ID
            intakeDate: Date
            isPreButchered: Boolean
            animalLines: [RegistrationAnimalLineInput!]!
        ): RegistrationResponse @auth(permissions: ["GUARD", "STOREKEEPER", "MANAGER", "SUPER_ADMIN"])

        # Weighing can be carried out by anyone on the floor except the
        # gate guard — covering shifts where SCALE isn't around, the store-
        # keeper / manager / admin steps in.
        addWeighingEntry(
            registrationId: ID!
            animalType: ANIMAL_TYPE!
            weightKg: Float!
            pricePerKg: Float
            photoFileId: ID
        ): WeighingEntryResponse @auth(permissions: ["SCALE", "STOREKEEPER", "MODERATOR", "MANAGER", "ADMIN", "SUPER_ADMIN"])

        finishWeighing(
            registrationId: ID!
        ): RegistrationResponse @auth(permissions: ["SCALE", "STOREKEEPER", "MODERATOR", "MANAGER", "ADMIN", "SUPER_ADMIN"])

        updateWeighingEntry(
            id: ID!
            weightKg: Float
            pricePerKg: Float
            animalType: ANIMAL_TYPE
            photoFileId: ID
        ): WeighingEntryResponse @auth(permissions: ["SCALE", "STOREKEEPER", "MODERATOR", "MANAGER", "ADMIN", "SUPER_ADMIN"])

        deleteWeighingEntry(
            id: ID!
        ): Response @auth(permissions: ["SCALE", "STOREKEEPER", "MODERATOR", "MANAGER", "ADMIN", "SUPER_ADMIN"])

        setRegistrationByproducts(
            registrationId: ID!
            items: [ByproductItemInput!]!
        ): RegistrationResponse @auth(permissions: ["STOREKEEPER", "MANAGER", "SUPER_ADMIN"])

        verifyRegistration(
            registrationId: ID!
            notes: String
            photoFileId: ID
        ): VerificationResponse @auth(permissions: ["STOREKEEPER", "MANAGER", "ADMIN", "SUPER_ADMIN"])

        setSlaughterCovered(
            registrationId: ID!
            covered: Boolean!
        ): VerificationResponse @auth(permissions: ["STOREKEEPER", "MANAGER", "ADMIN", "SUPER_ADMIN"])

        createSettlement(
            registrationId: ID!
            lines: [SettlementLineInput!]!
            notes: String
            photoFileId: ID
            # Optional per-settlement payout override.
            payoutBankAccount: String
            payoutBankName: String
            payoutAccountHolderName: String
        ): SettlementResponse @auth(permissions: ["STOREKEEPER", "MANAGER", "SUPER_ADMIN"])

        markSettlementPaid(
            registrationId: ID!
        ): SettlementResponse @auth(permissions: ["STOREKEEPER", "MANAGER", "SUPER_ADMIN"])

        cancelRegistration(
            registrationId: ID!
        ): RegistrationResponse @auth(permissions: ["MANAGER", "SUPER_ADMIN"])
    }
`;
