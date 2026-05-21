import { mergeTypeDefs } from "@graphql-tools/merge";

//Global
import globalType from "./global/global.type";
import fileType from "./global/file.type";

//User
import adminType from "./user/admin.type";

//Livestock
import herderType from "./livestock/herder.type";
import registrationType from "./livestock/registration.type";

//Customer
import customerType from "./customer/customer.type";

//Sales
import salesTransactionType from "./sales/sales-transaction.type";

//Shipment
import shipmentType from "./shipment/shipment.type";

//Inventory
import inventoryType from "./inventory/inventory.type";

//Dashboard
import dashboardType from "./dashboard/dashboard.type";

export const mergedGQLSchema = mergeTypeDefs([
  globalType,
  fileType,

  //User
  adminType,

  //Livestock
  herderType,
  registrationType,

  //Customer
  customerType,

  //Sales
  salesTransactionType,

  //Shipment
  shipmentType,

  //Inventory
  inventoryType,

  //Dashboard
  dashboardType,
]);
