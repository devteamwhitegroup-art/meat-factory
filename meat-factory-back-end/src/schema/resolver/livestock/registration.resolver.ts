import { RegistrationController } from '../../../controller/livestock/registration.controller';

export default {
  Query: {
    registrations: async (_, doc) => {
      try {
        const { rows, count } = await RegistrationController.list(doc);
        return {
          success: true,
          message: 'Success',
          registrations: rows,
          count
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          registrations: [],
          count: 0
        };
      }
    },
    registration: async (_, { id }) => {
      try {
        return {
          success: true,
          message: 'Success',
          registration: await RegistrationController.getById(id)
        };
      } catch (error) {
        return { success: false, message: error.message, registration: null };
      }
    }
  },
  Mutation: {
    createRegistration: async (_, doc, context) => {
      try {
        return {
          success: true,
          message: 'Registration created successfully',
          registration: await RegistrationController.create(doc, context)
        };
      } catch (error) {
        return { success: false, message: error.message, registration: null };
      }
    },
    addWeighingEntry: async (_, doc, context) => {
      try {
        return {
          success: true,
          message: 'Weighing entry added',
          weighingEntry: await RegistrationController.addWeighingEntry(
            doc,
            context
          )
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          weighingEntry: null
        };
      }
    },
    finishWeighing: async (_, { registrationId }, context) => {
      try {
        return {
          success: true,
          message: 'Weighing finished',
          registration: await RegistrationController.finishWeighing(
            registrationId,
            context
          )
        };
      } catch (error) {
        return { success: false, message: error.message, registration: null };
      }
    },
    addByproductLog: async (_, doc, context) => {
      try {
        return {
          success: true,
          message: 'Byproduct logged',
          byproductLog: await RegistrationController.addByproductLog(
            doc,
            context
          )
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          byproductLog: null
        };
      }
    },
    verifyRegistration: async (_, doc, context) => {
      try {
        return {
          success: true,
          message: 'Verification recorded',
          verification: await RegistrationController.verify(doc, context)
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          verification: null
        };
      }
    },
    createSettlement: async (_, doc, context) => {
      try {
        return {
          success: true,
          message: 'Settlement created',
          settlement: await RegistrationController.createSettlement(
            doc,
            context
          )
        };
      } catch (error) {
        return { success: false, message: error.message, settlement: null };
      }
    },
    markSettlementPaid: async (_, { registrationId }, context) => {
      try {
        return {
          success: true,
          message: 'Settlement marked paid',
          settlement: await RegistrationController.markSettlementPaid(
            registrationId,
            context
          )
        };
      } catch (error) {
        return { success: false, message: error.message, settlement: null };
      }
    },
    cancelRegistration: async (_, { registrationId }, context) => {
      try {
        return {
          success: true,
          message: 'Registration cancelled',
          registration: await RegistrationController.cancel(
            registrationId,
            context
          )
        };
      } catch (error) {
        return { success: false, message: error.message, registration: null };
      }
    }
  }
};
