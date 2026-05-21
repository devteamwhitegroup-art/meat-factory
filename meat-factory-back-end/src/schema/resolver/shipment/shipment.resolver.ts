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
    }
  }
};
