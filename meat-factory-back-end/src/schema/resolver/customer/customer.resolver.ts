import { CustomerController } from '../../../controller/customer/customer.controller';

export default {
  Query: {
    customers: async (_, doc) => {
      try {
        const { rows, count } = await CustomerController.list(doc);
        return {
          success: true,
          message: 'Success',
          customers: rows,
          count
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          customers: [],
          count: 0
        };
      }
    },
    customer: async (_, { id }) => {
      try {
        return {
          success: true,
          message: 'Success',
          customer: await CustomerController.getById(id)
        };
      } catch (error) {
        return { success: false, message: error.message, customer: null };
      }
    }
  },
  Mutation: {
    createCustomer: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Customer created successfully',
          customer: await CustomerController.create(doc)
        };
      } catch (error) {
        return { success: false, message: error.message, customer: null };
      }
    },
    updateCustomer: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Customer updated successfully',
          customer: await CustomerController.update(doc)
        };
      } catch (error) {
        return { success: false, message: error.message, customer: null };
      }
    },
    deleteCustomer: async (_, { id }) => {
      try {
        await CustomerController.remove(id);
        return { success: true, message: 'Customer deleted successfully' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
};
