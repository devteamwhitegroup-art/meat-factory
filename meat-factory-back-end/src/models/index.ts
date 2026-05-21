import { Sequelize } from "sequelize";

//User
import { createAdminModel, AdminModel } from "./user/admin.model";

//File
import { FileModel, createFileModel } from "./global/file.model";

//Livestock
import { createHerderModel, HerderModel } from "./livestock/herder.model";
import {
  createRegistrationModel,
  RegistrationModel,
} from "./livestock/registration.model";
import {
  createRegistrationAnimalLineModel,
  RegistrationAnimalLineModel,
} from "./livestock/registration-animal-line.model";
import {
  createWeighingEntryModel,
  WeighingEntryModel,
} from "./livestock/weighing-entry.model";
import {
  createByproductLogModel,
  ByproductLogModel,
} from "./livestock/byproduct-log.model";
import {
  createVerificationModel,
  VerificationModel,
} from "./livestock/verification.model";
import {
  createSettlementModel,
  SettlementModel,
} from "./livestock/settlement.model";
import {
  createSettlementLineModel,
  SettlementLineModel,
} from "./livestock/settlement-line.model";

//Customer
import {
  createCustomerModel,
  CustomerModel,
} from "./customer/customer.model";

//Sales
import {
  createSalesTransactionModel,
  SalesTransactionModel,
} from "./sales/sales-transaction.model";
import {
  createSalesLineItemModel,
  SalesLineItemModel,
} from "./sales/sales-line-item.model";

//Shipment
import {
  createShipmentModel,
  ShipmentModel,
} from "./shipment/shipment.model";

//Inventory
import {
  createInventoryItemModel,
  InventoryItemModel,
} from "./inventory/inventory-item.model";
import {
  createInventoryMovementModel,
  InventoryMovementModel,
} from "./inventory/inventory-movement.model";

export const setupModel = (sequelize: Sequelize) => {
  // ── Phase 1: init() — parent-before-child (FK topological order) ──
  //User
  createAdminModel(sequelize);

  //File
  createFileModel(sequelize);

  //Livestock
  createHerderModel(sequelize);
  createRegistrationModel(sequelize);
  createRegistrationAnimalLineModel(sequelize);
  createWeighingEntryModel(sequelize);
  createByproductLogModel(sequelize);
  createVerificationModel(sequelize);
  createSettlementModel(sequelize);
  createSettlementLineModel(sequelize);

  //Customer
  createCustomerModel(sequelize);

  //Sales
  createSalesTransactionModel(sequelize);
  createSalesLineItemModel(sequelize);

  //Shipment
  createShipmentModel(sequelize);

  //Inventory
  createInventoryItemModel(sequelize);
  createInventoryMovementModel(sequelize);

  // ── Phase 2: associate() — AFTER all init() (circular-import safety) ──
  //User
  AdminModel.associate();

  //File
  FileModel.associate();

  //Livestock
  HerderModel.associate();
  RegistrationModel.associate();
  RegistrationAnimalLineModel.associate();
  WeighingEntryModel.associate();
  ByproductLogModel.associate();
  VerificationModel.associate();
  SettlementModel.associate();
  SettlementLineModel.associate();

  //Customer
  CustomerModel.associate();

  //Sales
  SalesTransactionModel.associate();
  SalesLineItemModel.associate();

  //Shipment
  ShipmentModel.associate();

  //Inventory
  InventoryItemModel.associate();
  InventoryMovementModel.associate();
};
