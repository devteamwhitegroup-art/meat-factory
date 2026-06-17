import { InventoryController } from '../../../controller/inventory/inventory.controller';

export default {
  Query: {
    inventoryStock: async (_, doc) => {
      try {
        const { rows, count } = await InventoryController.getStock(doc);
        return {
          success: true,
          message: 'Success',
          inventoryItems: rows,
          count
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          inventoryItems: [],
          count: 0
        };
      }
    },
    inventoryMovements: async (_, doc) => {
      try {
        const { rows, count } = await InventoryController.listMovements(doc);
        return {
          success: true,
          message: 'Success',
          movements: rows,
          count
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          movements: [],
          count: 0
        };
      }
    },
    inventoryStats: async () => {
      try {
        return {
          success: true,
          message: 'Success',
          stats: await InventoryController.stats()
        };
      } catch (error) {
        return { success: false, message: error.message, stats: null };
      }
    }
  },
  Mutation: {
    adjustInventory: async (_, doc, context) => {
      try {
        return {
          success: true,
          message: 'Inventory adjusted',
          inventoryItem: await InventoryController.manualAdjust(
            doc,
            context.id
          )
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          inventoryItem: null
        };
      }
    }
  }
};
