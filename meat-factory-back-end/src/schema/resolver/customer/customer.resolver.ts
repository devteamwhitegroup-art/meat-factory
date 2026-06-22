import { CustomerController } from "../../../controller/customer/customer.controller";
import {
  TCreateCustomer,
  TGetCustomers,
  TUpdateCustomer,
} from "../../../types/customer/customer.type";
import { wrapList, wrapOne, wrapVoid } from "../../../utils";

export default {
  Query: {
    customers: wrapList("customers", (doc: TGetCustomers) =>
      CustomerController.list(doc),
    ),
    customer: wrapOne("customer", ({ id }: { id: string }) =>
      CustomerController.getById(id),
    ),
  },
  Mutation: {
    createCustomer: wrapOne(
      "customer",
      (doc: TCreateCustomer) => CustomerController.create(doc),
      "Customer created successfully",
    ),
    updateCustomer: wrapOne(
      "customer",
      (doc: TUpdateCustomer) => CustomerController.update(doc),
      "Customer updated successfully",
    ),
    deleteCustomer: wrapVoid(
      "Customer deleted successfully",
      ({ id }: { id: string }) => CustomerController.remove(id),
    ),
  },
};
