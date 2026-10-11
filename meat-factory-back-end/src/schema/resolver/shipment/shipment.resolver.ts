import { ShipmentController } from "../../../controller/shipment/shipment.controller";
import {
  SHIPMENT_STATUS,
  TCreateShipment,
  TGetShipments,
} from "../../../types/shipment/shipment.type";
import { PRODUCT_TYPE } from "../../../types/sales/sales-transaction.type";
import { CostingController } from "../../../controller/inventory/costing.controller";
import { ShipmentSaleLineModel } from "../../../models/shipment/shipment-sale-line.model";
import { TShipmentSaleEntry } from "../../../types/shipment/shipment-sale-line.type";
import { wrapList, wrapOne, wrapVoid } from "../../../utils";

export default {
  // Report-derived totals — computed on read from the included entries.
  ShipmentSaleLine: {
    soldKg: (line: ShipmentSaleLineModel): number =>
      Number(
        (line.entries ?? [])
          .reduce((s, e) => s + Number(e.weightKg), 0)
          .toFixed(2),
      ),
    amount: (line: ShipmentSaleLineModel): number | null =>
      line.entries?.length
        ? Number(
            line.entries
              .reduce(
                (s, e) => s + Number(e.weightKg) * Number(e.pricePerKg),
                0,
              )
              .toFixed(2),
          )
        : null,
  },
  ShipmentSaleEntry: {
    amount: (e: TShipmentSaleEntry): number =>
      Number((Number(e.weightKg) * Number(e.pricePerKg)).toFixed(2)),
  },
  Query: {
    shipments: wrapList("shipments", (doc: TGetShipments, ctx) =>
      ShipmentController.list(doc, ctx),
    ),
    shipment: wrapOne("shipment", ({ id }: { id: string }) =>
      ShipmentController.getById(id),
    ),
    nextShipmentSerial: wrapOne("serialNumber", () =>
      ShipmentController.previewNextSerial(),
    ),
    shipmentAnalytics: wrapOne("analytics", ({ id }: { id: string }) =>
      CostingController.shipmentAnalytics(id),
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
      ({ id, status }: { id: string; status: SHIPMENT_STATUS }) =>
        ShipmentController.updateStatus(id, status),
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
      ({ id }: { id: string }) => ShipmentController.deleteSaleEntry(id),
    ),
    addCargoEntry: wrapOne(
      "cargoEntry",
      (
        doc: {
          shipmentId: string;
          productType: PRODUCT_TYPE;
          animalType?: string | null;
          byproductName?: string | null;
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
            byproductName: doc.byproductName ?? null,
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
      }) =>
        ShipmentController.updateLoadingInfo(id, {
          vehiclePlate,
          driverName,
          driverPhone,
          sealNumber,
        }),
      "Ачилтын мэдээлэл хадгалагдлаа",
    ),
    addShipmentPhoto: wrapOne(
      "photo",
      ({ shipmentId, fileId }: { shipmentId: string; fileId: string }) =>
        ShipmentController.addPhoto(shipmentId, fileId),
      "Зураг нэмэгдлээ",
    ),
    removeShipmentPhoto: wrapVoid(
      "Зураг устгагдлаа",
      ({ id }: { id: string }) => ShipmentController.removePhoto(id),
    ),
  },
};
