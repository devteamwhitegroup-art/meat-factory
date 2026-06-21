import { ShipmentController } from '../../../controller/shipment/shipment.controller';
import {
  SHIPMENT_STATUS,
  TCreateShipment,
  TGetShipments
} from '../../../types/shipment/shipment.type';
import { wrapList, wrapOne, wrapVoid } from '../../../utils';

export default {
  Query: {
    shipments: wrapList('shipments', (doc: TGetShipments) =>
      ShipmentController.list(doc)
    ),
    shipment: wrapOne('shipment', ({ id }: { id: string }) =>
      ShipmentController.getById(id)
    )
  },
  Mutation: {
    createShipment: wrapOne(
      'shipment',
      (doc: TCreateShipment, ctx) => ShipmentController.create(doc, ctx),
      'Shipment created'
    ),
    updateShipmentStatus: wrapOne(
      'shipment',
      ({ id, status }: { id: string; status: SHIPMENT_STATUS }) =>
        ShipmentController.updateStatus(id, status),
      'Shipment status updated'
    ),
    addCargoEntry: wrapOne(
      'cargoEntry',
      (
        doc: {
          shipmentId: string;
          productLabel: string;
          pieceCount?: number | null;
          grossKg?: number | null;
          tareKg?: number | null;
          weightKg?: number | null;
          pricePerKg?: number | null;
        },
        ctx
      ) =>
        ShipmentController.addCargoEntry(
          doc.shipmentId,
          {
            productLabel: doc.productLabel,
            pieceCount: doc.pieceCount ?? null,
            grossKg: doc.grossKg ?? null,
            tareKg: doc.tareKg ?? null,
            weightKg: doc.weightKg ?? null,
            pricePerKg: doc.pricePerKg ?? null
          },
          ctx
        ),
      'Ачилтын мөр нэмэгдлээ'
    ),
    updateCargoEntryPrice: wrapOne(
      'cargoEntry',
      ({ id, pricePerKg }: { id: string; pricePerKg?: number | null }) =>
        ShipmentController.updateCargoEntryPrice(id, pricePerKg ?? null),
      'Үнэ хадгалагдлаа'
    ),
    deleteCargoEntry: wrapVoid(
      'Ачилтын мөр устгагдлаа',
      ({ id }: { id: string }, ctx) =>
        ShipmentController.deleteCargoEntry(id, ctx)
    ),
    updateShipmentLoadingInfo: wrapOne(
      'shipment',
      ({
        id,
        vehiclePlate,
        driverName,
        driverPhone,
        serialNumber
      }: {
        id: string;
        vehiclePlate?: string | null;
        driverName?: string | null;
        driverPhone?: string | null;
        serialNumber?: string | null;
      }) =>
        ShipmentController.updateLoadingInfo(id, {
          vehiclePlate,
          driverName,
          driverPhone,
          serialNumber
        }),
      'Ачилтын мэдээлэл хадгалагдлаа'
    ),
    addShipmentPhoto: wrapOne(
      'photo',
      ({ shipmentId, fileId }: { shipmentId: string; fileId: string }) =>
        ShipmentController.addPhoto(shipmentId, fileId),
      'Зураг нэмэгдлээ'
    ),
    removeShipmentPhoto: wrapVoid(
      'Зураг устгагдлаа',
      ({ id }: { id: string }) => ShipmentController.removePhoto(id)
    )
  }
};
