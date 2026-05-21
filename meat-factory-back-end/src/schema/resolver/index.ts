//User
import adminResolver from "./user/admin.resolver";

//Livestock
import herderResolver from "./livestock/herder.resolver";
import registrationResolver from "./livestock/registration.resolver";

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

export const resolvers = [
  //User
  adminResolver,

  //Livestock
  herderResolver,
  registrationResolver,

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
