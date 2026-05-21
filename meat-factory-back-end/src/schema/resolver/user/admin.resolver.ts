import { AdminController } from '../../../controller/user/admin.controller';

export default {
  Query: {
    currentAdmin: async (_, __, context) => {
      try {
        return {
          success: true,
          message: 'Success',
          admin: await AdminController.currentAdmin(context)
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    }
  },
  Mutation: {
    loginAdmin: async (_, doc) => {
      try {
        const { admin, token } = await AdminController.login(doc);
        return {
          success: true,
          message: 'Login successful',
          admin,
          token
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          admin: null,
          token: null
        };
      }
    },
    createAdmin: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Admin created successfully',
          admin: await AdminController.createAdmin(doc)
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          admin: null
        };
      }
    },
    updateAdmin: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Admin updated successfully',
          admin: await AdminController.updateAdmin(doc)
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          admin: null
        };
      }
    },
    deleteAdmin: async (_, doc) => {
      try {
        await AdminController.deleteAdmin(doc);
        return {
          success: true,
          message: 'Admin deleted successfully'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message
        };
      }
    }
  }
};
