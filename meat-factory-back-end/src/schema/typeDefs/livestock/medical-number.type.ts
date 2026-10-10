import { PaginationSchema } from "../global/global.type";
import { MEDICAL_NUMBER_STATUS } from "../../../types/livestock/medical-number.type";

export default `#graphql
    enum MEDICAL_NUMBER_STATUS {
        ${Object.values(MEDICAL_NUMBER_STATUS).join("\n ")}
    }

    # One medical certificate number (exactly 7 digits) of a registration.
    # The vet checks it against the government service and sets the status.
    type MedicalNumber {
        id: ID
        registrationId: ID
        number: String
        status: MEDICAL_NUMBER_STATUS
        checkedAt: Date
        checkedBy: Admin
        createdAt: Date
        registration: Registration
    }

    type MedicalNumberResponse {
        success: Boolean
        message: String
        medicalNumber: MedicalNumber
    }

    type MedicalNumbersResponse {
        success: Boolean
        message: String
        medicalNumbers: [MedicalNumber]
        count: Int
    }

    extend type Query {
        # Vet worklist. Staff see their own factory; owner/admin may filter.
        medicalNumbers(
            status: MEDICAL_NUMBER_STATUS
            number: String
            factory: FACTORY
            dateRange: DateRangeInput
            ${PaginationSchema}
        ): MedicalNumbersResponse @auth(permissions: ["ADMIN", "DOCTOR"])
    }

    extend type Mutation {
        addMedicalNumber(
            registrationId: ID!
            number: String!
        ): MedicalNumberResponse @auth(permissions: ["ADMIN", "STOREKEEPER", "DOCTOR"])

        # PENDING (unchecked) numbers only.
        removeMedicalNumber(id: ID!): Response @auth(permissions: ["ADMIN", "STOREKEEPER", "DOCTOR"])

        setMedicalNumberStatus(
            id: ID!
            status: MEDICAL_NUMBER_STATUS!
        ): MedicalNumberResponse @auth(permissions: ["ADMIN", "DOCTOR"])
    }
`;
