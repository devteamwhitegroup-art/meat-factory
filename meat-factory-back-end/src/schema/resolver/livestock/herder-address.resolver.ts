import { HerderAddressController } from "../../../controller/livestock/herder-address.controller";
import {
  TCreateHerderAddress,
  TGetHerderAddresses,
  TUpdateHerderAddress,
} from "../../../types/livestock/herder-address.type";
import { wrapList, wrapOne, wrapVoid } from "../../../utils";

export default {
  Query: {
    herderAddresses: wrapList("herderAddresses", (doc: TGetHerderAddresses) =>
      HerderAddressController.list(doc),
    ),
    herderAddress: wrapOne("herderAddress", ({ id }: { id: string }) =>
      HerderAddressController.getById(id),
    ),
  },
  Mutation: {
    createHerderAddress: wrapOne(
      "herderAddress",
      (doc: TCreateHerderAddress) => HerderAddressController.create(doc),
      "Хаяг нэмэгдлээ",
    ),
    updateHerderAddress: wrapOne(
      "herderAddress",
      (doc: TUpdateHerderAddress) => HerderAddressController.update(doc),
      "Хаяг шинэчлэгдлээ",
    ),
    deleteHerderAddress: wrapVoid("Хаяг устгагдлаа", ({ id }: { id: string }) =>
      HerderAddressController.remove(id),
    ),
  },
};
