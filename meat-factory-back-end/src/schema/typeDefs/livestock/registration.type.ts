import {
  CHANGE_REQUEST_STATUS,
  REGISTRATION_STATUS,
} from "../../../types/livestock/registration.type";
import { WEIGHING_AUDIT_ACTION } from "../../../types/livestock/weighing-entry.type";
import { PaginationSchema } from "../global/global.type";

export default `#graphql
    enum REGISTRATION_STATUS {
        ${Object.values(REGISTRATION_STATUS).join("\n ")}
    }

    enum CHANGE_REQUEST_STATUS {
        ${Object.values(CHANGE_REQUEST_STATUS).join("\n ")}
    }

    enum WEIGHING_AUDIT_ACTION {
        ${Object.values(WEIGHING_AUDIT_ACTION).join("\n ")}
    }

    type RegistrationAnimalLine {
        id: ID
        registrationId: ID
        # animalId is the FK; animalType is resolved through the joined Animal
        # so existing consumers stay unchanged.
        animalId: ID
        animal: Animal
        animalType: String
        count: Int
        # Бой зардал per type, captured at weighing (pre-VERIFIED) for the
        # herder slip. Settlement defaults to this.
        slaughterCost: Float
        createdAt: Date
        updatedAt: Date
    }

    type WeighingEntry {
        id: ID
        registrationId: ID
        animalId: ID
        animal: Animal
        animalType: String
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

    # Append-only log of add/edit/remove on a WeighingEntry — see
    # WeighingEntryAuditModel for why this exists (mistake-fix accountability).
    type WeighingEntryAudit {
        id: ID
        registrationId: ID
        weighingEntryId: ID
        action: WEIGHING_AUDIT_ACTION
        actorId: ID
        actor: Admin
        weightKgBefore: Float
        weightKgAfter: Float
        pricePerKgBefore: Float
        pricePerKgAfter: Float
        createdAt: Date
    }

    # Herder-facing byproduct row: one per wrapper (гэдэс) or item
    # (constantId, PRE_BUTCHERED only) from the site's price list. The
    # factory keeps count − herderCount and credits them × unitPrice to the
    # settlement. id is null until first saved (defaults: factory keeps all).
    type ByproductBundle {
        id: ID
        wrapperId: ID
        constantId: ID
        name: String
        animalType: String
        count: Int
        herderCount: Int
        unitPrice: Float
    }

    input ByproductBundleInput {
        # Whole гэдэс: wrapperId; single item (PRE_BUTCHERED): constantId.
        wrapperId: ID
        constantId: ID
        count: Int!
        # LIVE_SLAUGHTER only: bundles the herder takes back.
        herderCount: Int
        # PRE_BUTCHERED only: market price (default: the site's price list).
        unitPrice: Float
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
        createdAt: Date
        updatedAt: Date
    }

    type SettlementLine {
        id: ID
        settlementId: ID
        animalId: ID
        animal: Animal
        animalType: String
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
        registration: Registration
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
        # Divisible payout. heldAmount is withheld pending medical-number
        # approval; paidAmount is disbursed so far; isPaid flips true only when
        # the held part is released.
        heldAmount: Float
        paidAmount: Float
        heldReleasedAt: Date
        isPaid: Boolean
        paidAt: Date
        settledById: ID
        settledBy: Admin
        notes: String
        photoFileId: ID
        photo: File
        # Storekeeper's drawn signature on the printed receipt — signed once,
        # reused on every subsequent print.
        storekeeperSignatureFileId: ID
        storekeeperSignature: File
        lines: [SettlementLine]
        # Money-flow statement images (bank receipts) attached after payout.
        paymentProofs: [SettlementPaymentProof]
        createdAt: Date
        updatedAt: Date
    }

    # One money-flow statement image on a settlement (bank transfer screenshot
    # / receipt), added after a payout. Multiple per settlement.
    type SettlementPaymentProof {
        id: ID
        settlementId: ID
        fileId: ID
        file: File
        sequenceNo: Int
        note: String
        createdById: ID
        createdBy: Admin
        createdAt: Date
        updatedAt: Date
    }

    type SettlementPaymentProofResponse {
        success: Boolean
        message: String
        proof: SettlementPaymentProof
    }

    type Registration {
        id: ID
        # Human-readable key REG-YYYYMMDD-N (N = per-day counter).
        registrationCode: String
        herderId: ID
        herder: Herder
        vehicleNumber: String
        stamp: String
        # 7-digit medical certificate numbers, each checked by the vet.
        medicalNumbers: [MedicalNumber!]
        # Every medical number APPROVED — gates release of the held
        # settlement portion.
        medicalNumberApproved: Boolean
        photoFileId: ID
        photo: File
        signatureFileId: ID
        signature: File
        stampFileId: ID
        stampImage: File
        # Herder's drawn agreement signature on the weighed slip (pre-VERIFIED).
        agreementSignatureFileId: ID
        agreementSignature: File
        intakeDate: Date
        guardId: ID
        guard: Admin
        status: REGISTRATION_STATUS
        # FACTORY_1 = live animals. FACTORY_2 = pre-butchered meat: no stamp,
        # no slaughter cost, no verify — stocked at finishWeighing.
        factory: String
        animalLines: [RegistrationAnimalLine]
        weighingEntries: [WeighingEntry]
        weighingAuditLog: [WeighingEntryAudit]
        byproductBundles: [ByproductBundle]
        verification: Verification
        settlement: Settlement
        # true → the caller may edit intake fields directly (admin, or the
        # person who registered it on the same day); else a change request.
        editableByMe: Boolean @authLogin
        createdAt: Date
        updatedAt: Date
    }

    # What a change request proposes; each part null when untouched.
    type RegistrationChanges {
        intake: RegistrationIntakeChange
        # Weight / price fixes of finished weighing entries.
        weights: [WeightChange]
        # Weighing entries to add.
        added: [WeighingAdd]
    }

    type RegistrationIntakeChange {
        herderId: ID
        herder: Herder
        vehicleNumber: String
        stamp: String
        animalLines: [RegistrationChangeLine]
    }

    type WeightChange {
        entryId: ID
        weightKg: Float
        pricePerKg: Float
        # Live entry — its weightKg / pricePerKg are the current values.
        entry: WeighingEntry
    }

    type WeighingAdd {
        animalType: String
        weightKg: Float
        pricePerKg: Float
    }

    input RegistrationIntakeInput {
        herderId: ID!
        vehicleNumber: String!
        stamp: String
        animalLines: [RegistrationAnimalLineInput!]!
    }

    input WeightChangeInput {
        entryId: ID!
        weightKg: Float!
        pricePerKg: Float
    }

    input WeighingAddInput {
        animalType: String!
        weightKg: Float!
        pricePerKg: Float
    }

    type RegistrationChangeLine {
        animalType: String
        count: Int
    }

    type RegistrationChangeRequest {
        id: ID
        registrationId: ID
        registration: Registration
        requestedBy: Admin
        changes: RegistrationChanges
        reason: String
        status: CHANGE_REQUEST_STATUS
        reviewedBy: Admin
        reviewedAt: Date
        reviewNote: String
        createdAt: Date
    }

    type RegistrationChangeRequestResponse {
        success: Boolean
        message: String
        changeRequest: RegistrationChangeRequest
    }

    type RegistrationChangeRequestsResponse {
        success: Boolean
        message: String
        changeRequests: [RegistrationChangeRequest]
        count: Int
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

    type SettlementsResponse {
        success: Boolean
        message: String
        settlements: [Settlement]
        count: Int
    }

    input RegistrationAnimalLineInput {
        animalType: String!
        count: Int!
    }

    # FACTORY_2 intake: meat weighed on the form.
    input IntakeWeighingInput {
        animalType: String!
        weightKg: Float!
        pricePerKg: Float!
    }

    # Бой зардал is fixed per head (set at intake) — not an input.
    input SettlementLineInput {
        animalType: String!
    }

    extend type Query {
        registrations(
            status: REGISTRATION_STATUS
            # Optional set filter: list rows whose status is IN this set.
            # Used by the FE "stage" chips (e.g. WEIGHED+VERIFIED).
            statuses: [REGISTRATION_STATUS!]
            herderId: ID
            registrationCode: String
            # Owner/admin only — factory staff always see their own.
            factory: String
            dateRange: DateRangeInput
            ${PaginationSchema}
        ): RegistrationsResponse @authLogin
        registration(id: ID!): RegistrationResponse @authLogin
        # Herder-side payout list — the "Малчид" tab on /sales.
        settlements(
            factory: String
            isPaid: Boolean
            herderId: ID
            dateRange: DateRangeInput
            ${PaginationSchema}
        ): SettlementsResponse @auth(permissions: [SETTLEMENT_CREATE, SETTLEMENT_PAY])
        # Admin: review queue. Staff: pass registrationId (their factory).
        registrationChangeRequests(
            status: CHANGE_REQUEST_STATUS
            registrationId: ID
            ${PaginationSchema}
        ): RegistrationChangeRequestsResponse @auth(permissions: [REGISTRATION_CREATE, CHANGE_REQUEST_REVIEW])
    }

    extend type Mutation {
        createRegistration(
            herderId: ID!
            vehicleNumber: String!
            stamp: String
            # Each exactly 7 digits.
            medicalNumbers: [String!]
            photoFileId: ID
            signatureFileId: ID
            stampFileId: ID
            intakeDate: Date
            # Owner/admin must pick; factory staff are stamped with their own.
            factory: String
            animalLines: [RegistrationAnimalLineInput!]!
            # Хойд үйлдвэр only — weighing entries created with the intake.
            weighings: [IntakeWeighingInput!]
        ): RegistrationResponse @auth(permissions: [REGISTRATION_CREATE])

        # Direct intake fix — admin, or the registering person on the same day.
        updateRegistration(
            id: ID!
            herderId: ID!
            vehicleNumber: String!
            stamp: String
            animalLines: [RegistrationAnimalLineInput!]!
        ): RegistrationResponse @auth(permissions: [REGISTRATION_CREATE])

        # Proposed values go to admin: intake after the registration day,
        # weighing fixes once weighing is finished. Send only changed parts.
        requestRegistrationChange(
            registrationId: ID!
            intake: RegistrationIntakeInput
            weights: [WeightChangeInput!]
            added: [WeighingAddInput!]
            reason: String!
        ): RegistrationChangeRequestResponse @auth(permissions: [REGISTRATION_CREATE])

        # Approve applies the changes; reject leaves the registration as is.
        reviewRegistrationChange(
            id: ID!
            approve: Boolean!
            note: String
        ): RegistrationChangeRequestResponse @auth(permissions: [CHANGE_REQUEST_REVIEW])

        # Weighing + price negotiation: storekeeper (нярав).
        addWeighingEntry(
            registrationId: ID!
            animalType: String!
            weightKg: Float!
            pricePerKg: Float
            photoFileId: ID
        ): WeighingEntryResponse @auth(permissions: [REGISTRATION_WEIGH, REGISTRATION_WEIGH_FIX])

        finishWeighing(
            registrationId: ID!
        ): RegistrationResponse @auth(permissions: [REGISTRATION_WEIGH])

        updateWeighingEntry(
            id: ID!
            weightKg: Float
            pricePerKg: Float
            animalType: String
            photoFileId: ID
        ): WeighingEntryResponse @auth(permissions: [REGISTRATION_WEIGH, REGISTRATION_WEIGH_FIX])

        deleteWeighingEntry(
            id: ID!
        ): Response @auth(permissions: [REGISTRATION_WEIGH, REGISTRATION_WEIGH_FIX])

        # Replaces the byproduct rows. LIVE_SLAUGHTER: at verify (WEIGHED) or
        # after VERIFIED (herder take, count ≤ head count). PRE_BUTCHERED:
        # while REGISTERED (items counted + priced on receipt).
        setRegistrationByproducts(
            registrationId: ID!
            bundles: [ByproductBundleInput!]!
        ): RegistrationResponse @auth(permissions: [REGISTRATION_WEIGH])

        verifyRegistration(
            registrationId: ID!
            notes: String
            photoFileId: ID
        ): VerificationResponse @auth(permissions: [REGISTRATION_VERIFY])

        createSettlement(
            registrationId: ID!
            lines: [SettlementLineInput!]!
            notes: String
            photoFileId: ID
            # Optional per-settlement payout override.
            payoutBankAccount: String
            payoutBankName: String
            payoutAccountHolderName: String
        ): SettlementResponse @auth(permissions: [SETTLEMENT_CREATE])

        # First payout. Pass heldAmount to withhold a portion when the medical
        # number isn't approved yet (required while unapproved; ignored/forced
        # to 0 once approved → full payment).
        markSettlementPaid(
            registrationId: ID!
            heldAmount: Float
        ): SettlementResponse @auth(permissions: [SETTLEMENT_PAY])

        # Release the withheld portion after the medical number is approved.
        releaseSettlementHold(
            registrationId: ID!
        ): SettlementResponse @auth(permissions: [SETTLEMENT_PAY])

        # Attach a money-flow statement image (uploaded File id) to the
        # settlement after a payout has been made.
        addSettlementPaymentProof(
            registrationId: ID!
            fileId: ID!
            note: String
        ): SettlementPaymentProofResponse @auth(permissions: [SETTLEMENT_PAY])

        removeSettlementPaymentProof(
            id: ID!
        ): Response @auth(permissions: [SETTLEMENT_PAY])

        # Attach the storekeeper's drawn signature (uploaded File id) to the
        # settlement receipt. Pass null to clear.
        setSettlementStorekeeperSignature(
            registrationId: ID!
            fileId: ID
        ): SettlementResponse @auth(permissions: [SETTLEMENT_PAY])

        cancelRegistration(
            registrationId: ID!
        ): RegistrationResponse @auth(permissions: [REGISTRATION_CANCEL])
    }
`;
