import {
  OrderController,
  OrderPackageController,
} from "../../../controller/order/order.controller";
import {
  ORDER_STATUS,
  TCreateOrder,
  TCreateOrderPackage,
  TGetOrders,
  TUpdateOrderPackage,
} from "../../../types/order/order.type";
import { wrapItems, wrapList, wrapOne, wrapVoid } from "../../../utils";

export default {
  Query: {
    publicOrderPackages: wrapItems("orderPackages", () => OrderPackageController.listActive()),
    orderPackages: wrapItems("orderPackages", () => OrderPackageController.list()),
    orders: wrapList("orders", (doc: TGetOrders) => OrderController.list(doc)),
  },
  Mutation: {
    createOrder: wrapOne("payment", (doc: TCreateOrder) => OrderController.create(doc), "Захиалга үүслээ"),
    checkOrderPayment: wrapOne("payment", ({ id }: { id: string }) => OrderController.checkPayment(id)),
    setOrderStatus: wrapOne(
      "order",
      ({ id, status }: { id: string; status: ORDER_STATUS }) => OrderController.setStatus(id, status),
      "Төлөв шинэчлэгдлээ",
    ),
    createOrderPackage: wrapOne(
      "orderPackage",
      (doc: TCreateOrderPackage) => OrderPackageController.create(doc),
      "Багц нэмэгдлээ",
    ),
    updateOrderPackage: wrapOne(
      "orderPackage",
      (doc: TUpdateOrderPackage) => OrderPackageController.update(doc),
      "Багц шинэчлэгдлээ",
    ),
    deleteOrderPackage: wrapVoid("Багц устгагдлаа", ({ id }: { id: string }) =>
      OrderPackageController.remove(id),
    ),
  },
};
