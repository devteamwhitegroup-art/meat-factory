import { Sequelize } from "sequelize";

//User
import { createAdminModel, AdminModel } from "./user/admin.model";

//File
import { FileModel, createFileModel } from "./global/file.model";

//Livestock
import { createHerderModel, HerderModel } from "./livestock/herder.model";
import {
  createHerderAddressModel,
  HerderAddressModel,
} from "./livestock/herder-address.model";
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
import {
  createSettlementPaymentProofModel,
  SettlementPaymentProofModel,
} from "./livestock/settlement-payment-proof.model";
import {
  createByproductWrapperModel,
  ByproductWrapperModel,
} from "./livestock/byproduct-wrapper.model";
import {
  createByproductConstantModel,
  ByproductConstantModel,
} from "./livestock/byproduct-constant.model";
import { createAnimalModel, AnimalModel } from "./livestock/animal.model";

//Customer
import { createCustomerModel, CustomerModel } from "./customer/customer.model";

//Sales
import {
  createSalesTransactionModel,
  SalesTransactionModel,
} from "./sales/sales-transaction.model";
import {
  createSalesLineItemModel,
  SalesLineItemModel,
} from "./sales/sales-line-item.model";
import {
  createSalesInstallmentModel,
  SalesInstallmentModel,
} from "./sales/sales-installment.model";

//Shipment
import { createShipmentModel, ShipmentModel } from "./shipment/shipment.model";
import {
  createShipmentCargoEntryModel,
  ShipmentCargoEntryModel,
} from "./shipment/shipment-cargo-entry.model";
import {
  createShipmentPhotoModel,
  ShipmentPhotoModel,
} from "./shipment/shipment-photo.model";
import {
  createShipmentSaleLineModel,
  ShipmentSaleLineModel,
} from "./shipment/shipment-sale-line.model";

//Inventory
import {
  createInventoryItemModel,
  InventoryItemModel,
} from "./inventory/inventory-item.model";
import {
  createInventoryMovementModel,
  InventoryMovementModel,
} from "./inventory/inventory-movement.model";

//Settings (singleton config row)
import { createSettingsModel, SettingsModel } from "./settings/settings.model";

//Dashboard
import {
  createMonthlyBudgetModel,
  MonthlyBudgetModel,
} from "./dashboard/monthly-budget.model";

export const setupModel = (sequelize: Sequelize) => {
  // ── Phase 1: init() every model. Call order is NOT significant here — FK
  // columns and associations are wired in Phase 2 (associate). The load-bearing
  // rule is that ALL init() run before ANY associate() (circular-import safety). ──
  //User
  createAdminModel(sequelize);

  //File
  createFileModel(sequelize);

  //Livestock
  createHerderAddressModel(sequelize);
  createHerderModel(sequelize);
  createRegistrationModel(sequelize);
  createRegistrationAnimalLineModel(sequelize);
  createWeighingEntryModel(sequelize);
  createByproductLogModel(sequelize);
  createVerificationModel(sequelize);
  createSettlementModel(sequelize);
  createSettlementLineModel(sequelize);
  createSettlementPaymentProofModel(sequelize);
  createByproductWrapperModel(sequelize);
  createByproductConstantModel(sequelize);
  createAnimalModel(sequelize);

  //Customer
  createCustomerModel(sequelize);

  //Sales
  createSalesTransactionModel(sequelize);
  createSalesLineItemModel(sequelize);
  createSalesInstallmentModel(sequelize);

  //Shipment
  createShipmentModel(sequelize);
  createShipmentCargoEntryModel(sequelize);
  createShipmentPhotoModel(sequelize);
  createShipmentSaleLineModel(sequelize);

  //Inventory
  createInventoryItemModel(sequelize);
  createInventoryMovementModel(sequelize);

  //Settings
  createSettingsModel(sequelize);

  //Dashboard
  createMonthlyBudgetModel(sequelize);

  // ── Phase 2: associate() — AFTER all init() (circular-import safety) ──
  //User
  AdminModel.associate();

  //File
  FileModel.associate();

  //Livestock
  HerderAddressModel.associate();
  HerderModel.associate();
  RegistrationModel.associate();
  RegistrationAnimalLineModel.associate();
  WeighingEntryModel.associate();
  ByproductLogModel.associate();
  VerificationModel.associate();
  SettlementModel.associate();
  SettlementLineModel.associate();
  SettlementPaymentProofModel.associate();
  ByproductWrapperModel.associate();
  ByproductConstantModel.associate();
  AnimalModel.associate();

  //Customer
  CustomerModel.associate();

  //Sales
  SalesTransactionModel.associate();
  SalesLineItemModel.associate();
  SalesInstallmentModel.associate();

  //Shipment
  ShipmentModel.associate();
  ShipmentCargoEntryModel.associate();
  ShipmentPhotoModel.associate();
  ShipmentSaleLineModel.associate();

  //Inventory
  InventoryItemModel.associate();
  InventoryMovementModel.associate();

  //Settings
  SettingsModel.associate();

  //Dashboard
  MonthlyBudgetModel.associate();
};
