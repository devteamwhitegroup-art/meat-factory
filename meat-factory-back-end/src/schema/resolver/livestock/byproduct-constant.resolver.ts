import { ByproductConstantController } from '../../../controller/livestock/byproduct-constant.controller';

export default {
  Query: {
    byproductConstants: async (_, doc) => {
      try {
        const { rows, count } = await ByproductConstantController.list(doc);
        return {
          success: true,
          message: 'Success',
          byproductConstants: rows,
          count
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          byproductConstants: [],
          count: 0
        };
      }
    },
    byproductConstant: async (_, { id }) => {
      try {
        return {
          success: true,
          message: 'Success',
          byproductConstant: await ByproductConstantController.getById(id)
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          byproductConstant: null
        };
      }
    }
  },
  Mutation: {
    createByproductConstant: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Дайвар норм нэмэгдлээ',
          byproductConstant: await ByproductConstantController.create(doc)
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          byproductConstant: null
        };
      }
    },
    updateByproductConstant: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Дайвар норм шинэчлэгдлээ',
          byproductConstant: await ByproductConstantController.update(doc)
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          byproductConstant: null
        };
      }
    },
    deleteByproductConstant: async (_, { id }) => {
      try {
        await ByproductConstantController.remove(id);
        return { success: true, message: 'Дайвар норм устгагдлаа' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
};
