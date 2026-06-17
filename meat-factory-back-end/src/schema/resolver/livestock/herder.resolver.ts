import { HerderController } from '../../../controller/livestock/herder.controller';
import { HerderModel } from '../../../models/livestock/herder.model';
import { HerderAddressModel } from '../../../models/livestock/herder-address.model';

// Lazy-load the catalogue row when the controller didn't eager-include it
// (e.g. mutation responses that re-fetch without the include).
async function loadAddressEntry(
  row: HerderModel
): Promise<HerderAddressModel | null> {
  if (row.addressEntry) return row.addressEntry;
  if (!row.addressId) return null;
  return await HerderAddressModel.findByPk(row.addressId);
}

export default {
  Herder: {
    // Keeps the legacy `address: String` contract — every prior FE query
    // selecting `address` keeps reading a plain string. The catalogue name
    // wins; the free-form column is the fallback.
    address: async (row: HerderModel) => {
      const entry = await loadAddressEntry(row);
      return entry?.name ?? row.address ?? null;
    },
    addressEntry: async (row: HerderModel) => {
      return await loadAddressEntry(row);
    }
  },
  Query: {
    herders: async (_, doc) => {
      try {
        const { rows, count } = await HerderController.list(doc);
        return {
          success: true,
          message: 'Success',
          herders: rows,
          count
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          herders: [],
          count: 0
        };
      }
    },
    herder: async (_, { id }) => {
      try {
        return {
          success: true,
          message: 'Success',
          herder: await HerderController.getById(id)
        };
      } catch (error) {
        return { success: false, message: error.message, herder: null };
      }
    }
  },
  Mutation: {
    createHerder: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Herder created successfully',
          herder: await HerderController.create(doc)
        };
      } catch (error) {
        return { success: false, message: error.message, herder: null };
      }
    },
    updateHerder: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Herder updated successfully',
          herder: await HerderController.update(doc)
        };
      } catch (error) {
        return { success: false, message: error.message, herder: null };
      }
    },
    deleteHerder: async (_, { id }) => {
      try {
        await HerderController.remove(id);
        return { success: true, message: 'Herder deleted successfully' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
};
