import { HerderAddressController } from '../../../controller/livestock/herder-address.controller';

export default {
  Query: {
    herderAddresses: async (_, doc) => {
      try {
        const { rows, count } = await HerderAddressController.list(doc);
        return {
          success: true,
          message: 'Success',
          herderAddresses: rows,
          count
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          herderAddresses: [],
          count: 0
        };
      }
    },
    herderAddress: async (_, { id }) => {
      try {
        return {
          success: true,
          message: 'Success',
          herderAddress: await HerderAddressController.getById(id)
        };
      } catch (error) {
        return { success: false, message: error.message, herderAddress: null };
      }
    }
  },
  Mutation: {
    createHerderAddress: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Хаяг нэмэгдлээ',
          herderAddress: await HerderAddressController.create(doc)
        };
      } catch (error) {
        return { success: false, message: error.message, herderAddress: null };
      }
    },
    updateHerderAddress: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Хаяг шинэчлэгдлээ',
          herderAddress: await HerderAddressController.update(doc)
        };
      } catch (error) {
        return { success: false, message: error.message, herderAddress: null };
      }
    },
    deleteHerderAddress: async (_, { id }) => {
      try {
        await HerderAddressController.remove(id);
        return { success: true, message: 'Хаяг устгагдлаа' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
};
