import { MedicalNumberController } from "../../../controller/livestock/medical-number.controller";
import {
  MEDICAL_NUMBER_STATUS,
  TGetMedicalNumbers,
} from "../../../types/livestock/medical-number.type";
import { wrapList, wrapOne, wrapVoid } from "../../../utils";

export default {
  Query: {
    medicalNumbers: wrapList("medicalNumbers", (doc: TGetMedicalNumbers, ctx) =>
      MedicalNumberController.list(doc, ctx),
    ),
  },
  Mutation: {
    addMedicalNumber: wrapOne(
      "medicalNumber",
      (
        { registrationId, number }: { registrationId: string; number: string },
        ctx,
      ) => MedicalNumberController.add(registrationId, number, ctx),
      "Дугаар нэмэгдлээ",
    ),
    removeMedicalNumber: wrapVoid(
      "Дугаар устгагдлаа",
      ({ id }: { id: string }, ctx) => MedicalNumberController.remove(id, ctx),
    ),
    setMedicalNumberStatus: wrapOne(
      "medicalNumber",
      ({ id, status }: { id: string; status: MEDICAL_NUMBER_STATUS }, ctx) =>
        MedicalNumberController.setStatus(id, status, ctx),
      "Төлөв хадгалагдлаа",
    ),
  },
};
