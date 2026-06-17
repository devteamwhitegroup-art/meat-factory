import { SalesTransactionController } from '../../../controller/sales/sales-transaction.controller';

export default {
  Query: {
    salesTransactions: async (_, doc) => {
      try {
        const { rows, count } = await SalesTransactionController.list(doc);
        return {
          success: true,
          message: 'Success',
          salesTransactions: rows,
          count
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          salesTransactions: [],
          count: 0
        };
      }
    },
    salesTransaction: async (_, { id }) => {
      try {
        return {
          success: true,
          message: 'Success',
          salesTransaction: await SalesTransactionController.getById(id)
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          salesTransaction: null
        };
      }
    }
  },
  Mutation: {
    createSalesTransaction: async (_, doc, context) => {
      try {
        return {
          success: true,
          message: 'Sales transaction created',
          salesTransaction: await SalesTransactionController.create(
            doc,
            context
          )
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          salesTransaction: null
        };
      }
    },
    markSalesTransactionPaid: async (_, { id }) => {
      try {
        return {
          success: true,
          message: 'Sales transaction marked paid',
          salesTransaction: await SalesTransactionController.markPaid(id)
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          salesTransaction: null
        };
      }
    },
    addSalesInstallment: async (_, doc, context) => {
      try {
        return {
          success: true,
          message: 'Хэсэгчилсэн төлбөр бүртгэгдлээ',
          installment: await SalesTransactionController.addInstallment(
            doc,
            context
          )
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          installment: null
        };
      }
    },
    removeSalesInstallment: async (_, { id }) => {
      try {
        await SalesTransactionController.removeInstallment(id);
        return { success: true, message: 'Устгагдлаа' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
};
