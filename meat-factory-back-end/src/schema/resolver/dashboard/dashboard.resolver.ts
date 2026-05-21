import { DashboardController } from '../../../controller/dashboard/dashboard.controller';

export default {
  Query: {
    dashboard: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Success',
          dashboard: await DashboardController.getDashboard(doc)
        };
      } catch (error) {
        return { success: false, message: error.message, dashboard: null };
      }
    }
  }
};
