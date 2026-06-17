import { ShipmentController } from '../../../controller/shipment/shipment.controller';

export default {
  Query: {
    shipments: async (_, doc) => {
      try {
        const { rows, count } = await ShipmentController.list(doc);
        return {
          success: true,
          message: 'Success',
          shipments: rows,
          count
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          shipments: [],
          count: 0
        };
      }
    },
    shipment: async (_, { id }) => {
      try {
        return {
          success: true,
          message: 'Success',
          shipment: await ShipmentController.getById(id)
        };
      } catch (error) {
        return { success: false, message: error.message, shipment: null };
      }
    }
  },
  Mutation: {
    createShipment: async (_, doc, context) => {
      try {
        return {
          success: true,
          message: 'Shipment created',
          shipment: await ShipmentController.create(doc, context)
        };
      } catch (error) {
        return { success: false, message: error.message, shipment: null };
      }
    },
    updateShipmentStatus: async (_, { id, status }) => {
      try {
        return {
          success: true,
          message: 'Shipment status updated',
          shipment: await ShipmentController.updateStatus(id, status)
        };
      } catch (error) {
        return { success: false, message: error.message, shipment: null };
      }
    },
    addCargoEntry: async (_, doc, context) => {
      try {
        return {
          success: true,
          message: 'Ачилтын мөр нэмэгдлээ',
          cargoEntry: await ShipmentController.addCargoEntry(
            doc.shipmentId,
            {
              productLabel: doc.productLabel,
              pieceCount: doc.pieceCount ?? null,
              grossKg: doc.grossKg ?? null,
              tareKg: doc.tareKg ?? null,
              weightKg: doc.weightKg ?? null,
              pricePerKg: doc.pricePerKg ?? null
            },
            context
          )
        };
      } catch (error) {
        return { success: false, message: error.message, cargoEntry: null };
      }
    },
    updateCargoEntryPrice: async (_, { id, pricePerKg }) => {
      try {
        return {
          success: true,
          message: 'Үнэ хадгалагдлаа',
          cargoEntry: await ShipmentController.updateCargoEntryPrice(
            id,
            pricePerKg ?? null
          )
        };
      } catch (error) {
        return { success: false, message: error.message, cargoEntry: null };
      }
    },
    deleteCargoEntry: async (_, { id }, context) => {
      try {
        await ShipmentController.deleteCargoEntry(id, context);
        return { success: true, message: 'Ачилтын мөр устгагдлаа' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    },
    updateShipmentLoadingInfo: async (
      _,
      { id, vehiclePlate, driverName, driverPhone, serialNumber }
    ) => {
      try {
        return {
          success: true,
          message: 'Ачилтын мэдээлэл хадгалагдлаа',
          shipment: await ShipmentController.updateLoadingInfo(id, {
            vehiclePlate,
            driverName,
            driverPhone,
            serialNumber
          })
        };
      } catch (error) {
        return { success: false, message: error.message, shipment: null };
      }
    },
    addShipmentPhoto: async (_, { shipmentId, fileId }) => {
      try {
        return {
          success: true,
          message: 'Зураг нэмэгдлээ',
          photo: await ShipmentController.addPhoto(shipmentId, fileId)
        };
      } catch (error) {
        return { success: false, message: error.message, photo: null };
      }
    },
    removeShipmentPhoto: async (_, { id }) => {
      try {
        await ShipmentController.removePhoto(id);
        return { success: true, message: 'Зураг устгагдлаа' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
};
