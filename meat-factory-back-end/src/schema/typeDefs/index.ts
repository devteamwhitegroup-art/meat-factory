import { mergeTypeDefs } from "@graphql-tools/merge";

//Global
import globalType from "./global/global.type";
import fileType from "./global/file.type";

//User
import adminType from "./user/admin.type";

//Livestock
import herderType from "./livestock/herder.type";
import herderAddressType from "./livestock/herder-address.type";
import registrationType from "./livestock/registration.type";
import byproductWrapperType from "./livestock/byproduct-wrapper.type";
import byproductConstantType from "./livestock/byproduct-constant.type";
import animalType from "./livestock/animal.type";

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
import monthlyBudgetType from "./dashboard/monthly-budget.type";

//Settings
import settingsType from "./settings/settings.type";

export const mergedGQLSchema = mergeTypeDefs([
  globalType,
  fileType,

  //User
  adminType,

  //Livestock
  herderType,
  herderAddressType,
  registrationType,
  byproductWrapperType,
  byproductConstantType,
  animalType,

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
  monthlyBudgetType,

  //Settings
  settingsType,
]);
