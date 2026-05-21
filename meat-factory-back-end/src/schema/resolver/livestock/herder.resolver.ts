import { HerderController } from '../../../controller/livestock/herder.controller';

export default {
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
