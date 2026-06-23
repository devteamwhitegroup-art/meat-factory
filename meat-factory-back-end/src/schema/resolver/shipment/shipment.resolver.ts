import { ShipmentController } from "../../../controller/shipment/shipment.controller";
import {
  SHIPMENT_STATUS,
  TCreateShipment,
  TGetShipments,
} from "../../../types/shipment/shipment.type";
import { ANIMAL_TYPE } from "../../../types/livestock/registration.type";
import { PRODUCT_TYPE } from "../../../types/sales/sales-transaction.type";
import { TShipmentSaleLine } from "../../../types/shipment/shipment-sale-line.type";
import { wrapList, wrapOne, wrapVoid } from "../../../utils";

export default {
  // Derived amount on a sale line — kept off the table, computed on read.
  ShipmentSaleLine: {
    amount: (line: TShipmentSaleLine): number | null =>
      line.pricePerKg == null
        ? null
        : Number(
            (Number(line.totalWeightKg) * Number(line.pricePerKg)).toFixed(2),
          ),
  },
  Query: {
    shipments: wrapList("shipments", (doc: TGetShipments) =>
      ShipmentController.list(doc),
    ),
    shipment: wrapOne("shipment", ({ id }: { id: string }) =>
      ShipmentController.getById(id),
    ),
    nextShipmentSerial: wrapOne("serialNumber", () =>
      ShipmentController.previewNextSerial(),
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
    setShipmentSalePrice: wrapOne(
      "saleLine",
      ({ id, pricePerKg }: { id: string; pricePerKg?: number | null }) =>
        ShipmentController.setSalePrice(id, pricePerKg ?? null),
      "Үнэ хадгалагдлаа",
    ),
    addCargoEntry: wrapOne(
      "cargoEntry",
      (
        doc: {
          shipmentId: string;
          productType: PRODUCT_TYPE;
          animalType?: ANIMAL_TYPE | null;
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
      }: {
        id: string;
        vehiclePlate?: string | null;
        driverName?: string | null;
        driverPhone?: string | null;
      }) =>
        ShipmentController.updateLoadingInfo(id, {
          vehiclePlate,
          driverName,
          driverPhone,
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
