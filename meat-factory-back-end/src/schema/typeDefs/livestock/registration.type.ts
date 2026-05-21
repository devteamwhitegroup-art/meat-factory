import {
  ANIMAL_TYPE,
  BYPRODUCT_TYPE,
  REGISTRATION_STATUS
} from '../../../types/livestock/registration.type';
import { PaginationSchema } from '../global/global.type';

export default `#graphql
    enum ANIMAL_TYPE {
        ${Object.values(ANIMAL_TYPE).join('\n ')}
    }

    enum BYPRODUCT_TYPE {
        ${Object.values(BYPRODUCT_TYPE).join('\n ')}
    }

    enum REGISTRATION_STATUS {
        ${Object.values(REGISTRATION_STATUS).join('\n ')}
    }

    type RegistrationAnimalLine {
        id: ID
        registrationId: ID
        animalType: ANIMAL_TYPE
        count: Int
        createdAt: Date
        updatedAt: Date
    }

    type WeighingEntry {
        id: ID
        registrationId: ID
        animalType: ANIMAL_TYPE
        weightKg: Float
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
        byproductType: BYPRODUCT_TYPE
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

    type Verification {
        id: ID
        registrationId: ID
        firstVerifierId: ID
        firstVerifier: Admin
        firstVerifiedAt: Date
        secondVerifierId: ID
        secondVerifier: Admin
        secondVerifiedAt: Date
        notes: String
        photoFileId: ID
        photo: File
        createdAt: Date
        updatedAt: Date
    }

    type SettlementLine {
        id: ID
        settlementId: ID
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
        photoFileId: ID
        photo: File
        intakeDate: Date
        guardId: ID
        guard: Admin
        status: REGISTRATION_STATUS
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

    type ByproductLogResponse {
        success: Boolean
        message: String
        byproductLog: ByproductLog
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
        pricePerKg: Float!
        slaughterCost: Float
        byproductPricePerKg: Float
    }

    extend type Query {
        registrations(
            status: REGISTRATION_STATUS
            herderId: ID
            registrationNumber: Int
            ${PaginationSchema}
        ): RegistrationsResponse @authLogin
        registration(id: ID!): RegistrationResponse @authLogin
    }

    extend type Mutation {
        createRegistration(
            herderId: ID!
            vehicleNumber: String!
            stamp: String
            photoFileId: ID
            intakeDate: Date
            animalLines: [RegistrationAnimalLineInput!]!
        ): RegistrationResponse @auth(permissions: ["GUARD", "MANAGER", "SUPER_ADMIN"])

        addWeighingEntry(
            registrationId: ID!
            animalType: ANIMAL_TYPE!
            weightKg: Float!
            photoFileId: ID
        ): WeighingEntryResponse @auth(permissions: ["SCALE", "MANAGER", "SUPER_ADMIN"])

        finishWeighing(
            registrationId: ID!
        ): RegistrationResponse @auth(permissions: ["SCALE", "MANAGER", "SUPER_ADMIN"])

        addByproductLog(
            registrationId: ID!
            byproductType: BYPRODUCT_TYPE!
            count: Int!
            averageWeightKg: Float!
            photoFileId: ID
        ): ByproductLogResponse @auth(permissions: ["STOREKEEPER", "MANAGER", "SUPER_ADMIN"])

        verifyRegistration(
            registrationId: ID!
            notes: String
            photoFileId: ID
        ): VerificationResponse @auth(permissions: ["STOREKEEPER", "SCALE", "MANAGER", "ADMIN", "SUPER_ADMIN"])

        createSettlement(
            registrationId: ID!
            lines: [SettlementLineInput!]!
            notes: String
            photoFileId: ID
        ): SettlementResponse @auth(permissions: ["STOREKEEPER", "MANAGER", "SUPER_ADMIN"])

        markSettlementPaid(
            registrationId: ID!
        ): SettlementResponse @auth(permissions: ["STOREKEEPER", "MANAGER", "SUPER_ADMIN"])

        cancelRegistration(
            registrationId: ID!
        ): RegistrationResponse @auth(permissions: ["MANAGER", "SUPER_ADMIN"])
    }
`;
