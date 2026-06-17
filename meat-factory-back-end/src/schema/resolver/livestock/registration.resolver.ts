import { RegistrationController } from '../../../controller/livestock/registration.controller';
import { AnimalModel } from '../../../models/livestock/animal.model';

// animalType is no longer a column on these four tables — it's reached via
// the FK to Animals. The field resolvers keep the existing GraphQL surface
// (`animalType` field) by reading from the (eager-loaded) joined `animal`.
async function resolveAnimalType(row: {
  animal?: AnimalModel;
  animalId?: string | null;
}): Promise<string | null> {
  if (row.animal?.animalType) return row.animal.animalType;
  if (!row.animalId) return null;
  const a = await AnimalModel.findByPk(row.animalId);
  return a?.animalType ?? null;
}

export default {
  RegistrationAnimalLine: {
    animalType: (row) => resolveAnimalType(row),
    animal: (row) => row.animal ?? null
  },
  WeighingEntry: {
    animalType: (row) => resolveAnimalType(row),
    animal: (row) => row.animal ?? null
  },
  ByproductLog: {
    animalType: (row) => resolveAnimalType(row),
    animal: (row) => row.animal ?? null
  },
  SettlementLine: {
    animalType: (row) => resolveAnimalType(row),
    animal: (row) => row.animal ?? null
  },
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
    },
    nextRegistrationNumber: async () => {
      try {
        return {
          success: true,
          message: 'Success',
          registrationNumber:
            await RegistrationController.previewNextRegistrationNumber()
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          registrationNumber: null
        };
      }
    },
    derivedByproducts: async (_, { registrationId }) => {
      try {
        return {
          success: true,
          message: 'Success',
          items: await RegistrationController.derivedByproducts(registrationId)
        };
      } catch (error) {
        return { success: false, message: error.message, items: [] };
      }
    },
    byproductHandoff: async (_, { dateRange }) => {
      try {
        return {
          success: true,
          message: 'Success',
          items: await RegistrationController.byproductHandoff(dateRange)
        };
      } catch (error) {
        return { success: false, message: error.message, items: [] };
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
    updateWeighingEntry: async (_, doc, context) => {
      try {
        return {
          success: true,
          message: 'Weighing entry updated',
          weighingEntry: await RegistrationController.updateWeighingEntry(
            doc,
            context
          )
        };
      } catch (error) {
        return { success: false, message: error.message, weighingEntry: null };
      }
    },
    deleteWeighingEntry: async (_, { id }, context) => {
      try {
        await RegistrationController.deleteWeighingEntry(id, context);
        return { success: true, message: 'Weighing entry deleted' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    },
    setRegistrationByproducts: async (_, { registrationId, items }, context) => {
      try {
        await RegistrationController.setRegistrationByproducts(
          registrationId,
          items,
          context
        );
        return {
          success: true,
          message: 'Дайвар хадгалагдлаа',
          registration: await RegistrationController.getById(registrationId)
        };
      } catch (error) {
        return { success: false, message: error.message, registration: null };
      }
    },
    setSlaughterCovered: async (_, { registrationId, covered }, context) => {
      try {
        return {
          success: true,
          message: 'Хадгалагдлаа',
          verification: await RegistrationController.setSlaughterCovered(
            registrationId,
            covered,
            context
          )
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          verification: null
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
