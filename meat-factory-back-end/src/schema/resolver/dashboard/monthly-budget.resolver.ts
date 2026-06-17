import { MonthlyBudgetController } from '../../../controller/dashboard/monthly-budget.controller';

export default {
  Query: {
    monthlyBudgets: async () => {
      try {
        return {
          success: true,
          message: 'Success',
          budgets: await MonthlyBudgetController.list()
        };
      } catch (error) {
        return { success: false, message: error.message, budgets: [] };
      }
    },
    monthlyOverview: async (_, { monthsBack }) => {
      try {
        return {
          success: true,
          message: 'Success',
          rows: await MonthlyBudgetController.overview(monthsBack ?? 12)
        };
      } catch (error) {
        return { success: false, message: error.message, rows: [] };
      }
    }
  },
  Mutation: {
    upsertMonthlyBudget: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Хадгалагдлаа',
          budget: await MonthlyBudgetController.upsert(doc)
        };
      } catch (error) {
        return { success: false, message: error.message, budget: null };
      }
    },
    deleteMonthlyBudget: async (_, { id }) => {
      try {
        await MonthlyBudgetController.remove(id);
        return { success: true, message: 'Устгагдлаа' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
};
