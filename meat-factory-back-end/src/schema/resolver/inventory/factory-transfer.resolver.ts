import { FactoryTransferController } from "../../../controller/inventory/factory-transfer.controller";
import {
  TCreateFactoryTransfer,
  TGetFactoryTransfers,
} from "../../../types/inventory/factory-transfer.type";
import { wrapList, wrapOne, wrapVoid } from "../../../utils";

export default {
  Query: {
    factoryTransfers: wrapList(
      "transfers",
      (doc: TGetFactoryTransfers, ctx) =>
        FactoryTransferController.list(doc, ctx),
    ),
  },
  Mutation: {
    createFactoryTransfer: wrapOne(
      "transfer",
      (doc: TCreateFactoryTransfer, ctx) =>
        FactoryTransferController.create(doc, ctx),
      "Илгээлээ",
    ),
    receiveFactoryTransfer: wrapVoid(
      "Хүлээн авлаа — нөөцөд орлоо",
      ({ id }: { id: string }, ctx) => FactoryTransferController.receive(id, ctx),
    ),
    cancelFactoryTransfer: wrapVoid(
      "Цуцаллаа — нөөцөд буцлаа",
      ({ id }: { id: string }, ctx) => FactoryTransferController.cancel(id, ctx),
    ),
  },
};
