//User
import adminResolver from "./user/admin.resolver";

//Livestock
import herderResolver from "./livestock/herder.resolver";
import herderAddressResolver from "./livestock/herder-address.resolver";
import registrationResolver from "./livestock/registration.resolver";
import byproductWrapperResolver from "./livestock/byproduct-wrapper.resolver";
import byproductConstantResolver from "./livestock/byproduct-constant.resolver";
import animalResolver from "./livestock/animal.resolver";

//Customer
import customerResolver from "./customer/customer.resolver";

//Sales
import salesTransactionResolver from "./sales/sales-transaction.resolver";

//Shipment
import shipmentResolver from "./shipment/shipment.resolver";

//Inventory
import inventoryResolver from "./inventory/inventory.resolver";

//Dashboard
import dashboardResolver from "./dashboard/dashboard.resolver";
import monthlyBudgetResolver from "./dashboard/monthly-budget.resolver";

//Settings
import settingsResolver from "./settings/settings.resolver";

export const resolvers = [
  //User
  adminResolver,

  //Livestock
  herderResolver,
  herderAddressResolver,
  registrationResolver,
  byproductWrapperResolver,
  byproductConstantResolver,
  animalResolver,

  //Customer
  customerResolver,

  //Sales
  salesTransactionResolver,

  //Shipment
  shipmentResolver,

  //Inventory
  inventoryResolver,

  //Dashboard
  dashboardResolver,
  monthlyBudgetResolver,

  //Settings
  settingsResolver,

  //Global
  {
    Query: {
      connect: () => "Connected Successfully",
    },
    Mutation: {
      connect: () => "Connected Successfully",
    },
  },
];
