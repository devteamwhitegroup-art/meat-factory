import { RegistrationController } from "../../../controller/livestock/registration.controller";
import { WeighingController } from "../../../controller/livestock/weighing.controller";
import { ByproductLogController } from "../../../controller/livestock/byproduct-log.controller";
import { VerificationController } from "../../../controller/livestock/verification.controller";
import { SettlementController } from "../../../controller/livestock/settlement.controller";
import { AnimalModel } from "../../../models/livestock/animal.model";
import { RegistrationAnimalLineModel } from "../../../models/livestock/registration-animal-line.model";
import { WeighingEntryModel } from "../../../models/livestock/weighing-entry.model";
import { ByproductLogModel } from "../../../models/livestock/byproduct-log.model";
import { SettlementLineModel } from "../../../models/livestock/settlement-line.model";
import {
  TCreateRegistration,
  TGetRegistrations,
  TSlaughterCostInput,
} from "../../../types/livestock/registration.type";
import {
  TCreateWeighingEntry,
  TUpdateWeighingEntry,
} from "../../../types/livestock/weighing-entry.type";
import { TByproductItemInput } from "../../../types/livestock/byproduct-log.type";
import { TVerifyInput } from "../../../types/livestock/verification.type";
import { TCreateSettlement } from "../../../types/livestock/settlement.type";
import { TDateRange } from "../../../types/dashboard/dashboard.type";
import { wrapItems, wrapList, wrapOne, wrapVoid } from "../../../utils";

// animalType is no longer a column on these four tables — it's reached via
// the FK to Animals. The field resolvers keep the existing GraphQL surface
// (`animalType` field) by reading from the (eager-loaded) joined `animal`.
async function resolveAnimalType(row: {
  animal?: AnimalModel;
  animalId?: string | null;
}): Promise<string | null> {
  if (row.animal?.animalType) return row.animal.animalType;
  if (!row.animalId) return null;
  const a = await AnimalModel.findByPk(row.animalId);
  return a?.animalType ?? null;
}

export default {
  RegistrationAnimalLine: {
    animalType: (row: RegistrationAnimalLineModel) => resolveAnimalType(row),
    animal: (row: RegistrationAnimalLineModel) => row.animal ?? null,
  },
  WeighingEntry: {
    animalType: (row: WeighingEntryModel) => resolveAnimalType(row),
    animal: (row: WeighingEntryModel) => row.animal ?? null,
  },
  ByproductLog: {
    animalType: (row: ByproductLogModel) => resolveAnimalType(row),
    animal: (row: ByproductLogModel) => row.animal ?? null,
  },
  SettlementLine: {
    animalType: (row: SettlementLineModel) => resolveAnimalType(row),
    animal: (row: SettlementLineModel) => row.animal ?? null,
  },
  Query: {
    registrations: wrapList("registrations", (doc: TGetRegistrations) =>
      RegistrationController.list(doc),
    ),
    registration: wrapOne("registration", ({ id }: { id: string }) =>
      RegistrationController.getById(id),
    ),
    nextRegistrationNumber: wrapOne("registrationNumber", () =>
      RegistrationController.previewNextRegistrationNumber(),
    ),
    derivedByproducts: wrapItems(
      "items",
      ({ registrationId }: { registrationId: string }) =>
        ByproductLogController.derivedByproducts(registrationId),
    ),
    byproductHandoff: wrapItems(
      "items",
      ({ dateRange }: { dateRange?: TDateRange }) =>
        ByproductLogController.byproductHandoff(dateRange),
    ),
  },
  Mutation: {
    createRegistration: wrapOne(
      "registration",
      (doc: TCreateRegistration, ctx) =>
        RegistrationController.create(doc, ctx),
      "Registration created successfully",
    ),
    addWeighingEntry: wrapOne(
      "weighingEntry",
      (doc: TCreateWeighingEntry, ctx) =>
        WeighingController.addWeighingEntry(doc, ctx),
      "Weighing entry added",
    ),
    finishWeighing: wrapOne(
      "registration",
      ({ registrationId }: { registrationId: string }, ctx) =>
        WeighingController.finishWeighing(registrationId, ctx),
      "Weighing finished",
    ),
    updateWeighingEntry: wrapOne(
      "weighingEntry",
      (doc: TUpdateWeighingEntry, ctx) =>
        WeighingController.updateWeighingEntry(doc, ctx),
      "Weighing entry updated",
    ),
    deleteWeighingEntry: wrapVoid(
      "Weighing entry deleted",
      ({ id }: { id: string }, ctx) =>
        WeighingController.deleteWeighingEntry(id, ctx),
    ),
    setRegistrationByproducts: wrapOne(
      "registration",
      async (
        {
          registrationId,
          items,
        }: { registrationId: string; items: TByproductItemInput[] },
        ctx,
      ) => {
        await ByproductLogController.setRegistrationByproducts(
          registrationId,
          items,
          ctx,
        );
        return RegistrationController.getById(registrationId);
      },
      "Дайвар хадгалагдлаа",
    ),
    setSlaughterCovered: wrapOne(
      "verification",
      (
        {
          registrationId,
          covered,
        }: { registrationId: string; covered: boolean },
        ctx,
      ) =>
        VerificationController.setSlaughterCovered(
          registrationId,
          covered,
          ctx,
        ),
      "Хадгалагдлаа",
    ),
    verifyRegistration: wrapOne(
      "verification",
      (doc: TVerifyInput, ctx) => VerificationController.verify(doc, ctx),
      "Verification recorded",
    ),
    createSettlement: wrapOne(
      "settlement",
      (doc: TCreateSettlement, ctx) =>
        SettlementController.createSettlement(doc, ctx),
      "Settlement created",
    ),
    markSettlementPaid: wrapOne(
      "settlement",
      (
        {
          registrationId,
          heldAmount,
        }: { registrationId: string; heldAmount?: number | null },
        ctx,
      ) =>
        SettlementController.markSettlementPaid(
          registrationId,
          heldAmount ?? null,
          ctx,
        ),
      "Settlement marked paid",
    ),
    releaseSettlementHold: wrapOne(
      "settlement",
      ({ registrationId }: { registrationId: string }, ctx) =>
        SettlementController.releaseSettlementHold(registrationId, ctx),
      "Held amount released",
    ),
    addSettlementPaymentProof: wrapOne(
      "proof",
      (
        {
          registrationId,
          fileId,
          note,
        }: { registrationId: string; fileId: string; note?: string | null },
        ctx,
      ) =>
        SettlementController.addPaymentProof(
          registrationId,
          fileId,
          note ?? null,
          ctx,
        ),
      "Баримт хавсаргалаа",
    ),
    removeSettlementPaymentProof: wrapVoid(
      "Баримт устгагдлаа",
      ({ id }: { id: string }, ctx) =>
        SettlementController.removePaymentProof(id, ctx),
    ),
    approveMedicalNumber: wrapOne(
      "registration",
      (
        {
          registrationId,
          medicalNumber,
        }: { registrationId: string; medicalNumber?: string | null },
        ctx,
      ) =>
        RegistrationController.approveMedicalNumber(
          registrationId,
          medicalNumber ?? null,
          ctx,
        ),
      "Medical number approved",
    ),
    setRegistrationSlaughterCosts: wrapOne(
      "registration",
      (
        {
          registrationId,
          lines,
        }: { registrationId: string; lines: TSlaughterCostInput[] },
        ctx,
      ) =>
        RegistrationController.setSlaughterCosts(registrationId, lines, ctx),
      "Slaughter costs saved",
    ),
    setRegistrationAgreementSignature: wrapOne(
      "registration",
      (
        {
          registrationId,
          fileId,
        }: { registrationId: string; fileId?: string | null },
        ctx,
      ) =>
        RegistrationController.setAgreementSignature(
          registrationId,
          fileId ?? null,
          ctx,
        ),
      "Signature saved",
    ),
    cancelRegistration: wrapOne(
      "registration",
      ({ registrationId }: { registrationId: string }, ctx) =>
        RegistrationController.cancel(registrationId, ctx),
      "Registration cancelled",
    ),
  },
};
