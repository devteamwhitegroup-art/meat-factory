import {
  ShipmentController,
  saleTotals,
} from "../../../controller/shipment/shipment.controller";
import {
  SHIPMENT_STATUS,
  TCreateShipment,
  TGetShipments,
} from "../../../types/shipment/shipment.type";
import { PRODUCT_TYPE } from "../../../types/sales/sales-transaction.type";
import { CostingController } from "../../../controller/inventory/costing.controller";
import { AnimalController } from "../../../controller/livestock/animal.controller";
import { ShipmentSaleLineModel } from "../../../models/shipment/shipment-sale-line.model";
import { ShipmentCargoEntryModel } from "../../../models/shipment/shipment-cargo-entry.model";
import { TShipmentSaleEntry } from "../../../types/shipment/shipment-sale-line.type";
import { round2, wrapItems, wrapList, wrapOne, wrapVoid } from "../../../utils";

export default {
  ShipmentCargoEntry: {
    animalType: (row: ShipmentCargoEntryModel) => AnimalController.nameOf(row),
  },
  // Report-derived totals — computed on read from the included entries.
  ShipmentSaleLine: {
    animalType: (row: ShipmentSaleLineModel) => AnimalController.nameOf(row),
    soldKg: (line: ShipmentSaleLineModel) => saleTotals(line.entries ?? []).soldKg,
    amount: (line: ShipmentSaleLineModel) => saleTotals(line.entries ?? []).amount,
  },
  ShipmentSaleEntry: {
    amount: (e: TShipmentSaleEntry): number =>
      round2(Number(e.weightKg) * Number(e.pricePerKg)),
  },
  Query: {
    shipments: wrapList("shipments", (doc: TGetShipments, ctx) =>
      ShipmentController.list(doc, ctx),
    ),
    shipment: wrapOne("shipment", ({ id }: { id: string }, ctx) =>
      ShipmentController.getById(id, ctx),
    ),
    shipmentStock: wrapItems(
      "items",
      ({ shipmentId }: { shipmentId: string }, ctx) =>
        ShipmentController.availableStock(shipmentId, ctx),
    ),
    nextShipmentSerial: wrapOne("serialNumber", () =>
      ShipmentController.previewNextSerial(),
    ),
    shipmentAnalytics: wrapOne("analytics", ({ id }: { id: string }, ctx) =>
      CostingController.shipmentAnalytics(id, ctx),
    ),
  },
  Mutation: {
    createShipment: wrapOne(
      "shipment",
      (doc: TCreateShipment, ctx) => ShipmentController.create(doc, ctx),
      "Shipment created",
    ),
    updateShipmentStatus: wrapOne(
      "shipment",
      ({ id, status }: { id: string; status: SHIPMENT_STATUS }, ctx) =>
        ShipmentController.updateStatus(id, status, ctx),
      "Shipment status updated",
    ),
    addShipmentSaleEntry: wrapOne(
      "saleEntry",
      (
        {
          saleLineId,
          weightKg,
          pricePerKg,
        }: { saleLineId: string; weightKg: number; pricePerKg: number },
        ctx,
      ) =>
        ShipmentController.addSaleEntry(saleLineId, weightKg, pricePerKg, ctx),
      "Борлуулалт бүртгэгдлээ",
    ),
    deleteShipmentSaleEntry: wrapVoid(
      "Борлуулалтын мөр устгагдлаа",
      ({ id }: { id: string }, ctx) =>
        ShipmentController.deleteSaleEntry(id, ctx),
    ),
    addCargoEntry: wrapOne(
      "cargoEntry",
      (
        doc: {
          shipmentId: string;
          productType: PRODUCT_TYPE;
          animalType?: string | null;
          sourceConstantId?: string | null;
          productLabel?: string | null;
          pieceCount?: number | null;
          grossKg?: number | null;
          tareKg?: number | null;
          weightKg?: number | null;
        },
        ctx,
      ) =>
        ShipmentController.addCargoEntry(
          doc.shipmentId,
          {
            productType: doc.productType,
            animalType: doc.animalType ?? null,
            sourceConstantId: doc.sourceConstantId ?? null,
            productLabel: doc.productLabel ?? null,
            pieceCount: doc.pieceCount ?? null,
            grossKg: doc.grossKg ?? null,
            tareKg: doc.tareKg ?? null,
            weightKg: doc.weightKg ?? null,
          },
          ctx,
        ),
      "Ачилтын мөр нэмэгдлээ",
    ),
    deleteCargoEntry: wrapVoid(
      "Ачилтын мөр устгагдлаа",
      ({ id }: { id: string }, ctx) =>
        ShipmentController.deleteCargoEntry(id, ctx),
    ),
    updateShipmentLoadingInfo: wrapOne(
      "shipment",
      ({
        id,
        vehiclePlate,
        driverName,
        driverPhone,
        sealNumber,
      }: {
        id: string;
        vehiclePlate?: string | null;
        driverName?: string | null;
        driverPhone?: string | null;
        sealNumber?: string | null;
      }, ctx) =>
        ShipmentController.updateLoadingInfo(
          id,
          { vehiclePlate, driverName, driverPhone, sealNumber },
          ctx,
        ),
      "Ачилтын мэдээлэл хадгалагдлаа",
    ),
    addShipmentPhoto: wrapOne(
      "photo",
      ({ shipmentId, fileId }: { shipmentId: string; fileId: string }, ctx) =>
        ShipmentController.addPhoto(shipmentId, fileId, ctx),
      "Зураг нэмэгдлээ",
    ),
    removeShipmentPhoto: wrapVoid(
      "Зураг устгагдлаа",
      ({ id }: { id: string }, ctx) => ShipmentController.removePhoto(id, ctx),
    ),
  },
};
