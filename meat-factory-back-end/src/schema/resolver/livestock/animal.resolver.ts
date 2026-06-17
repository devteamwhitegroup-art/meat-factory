import { AnimalController } from '../../../controller/livestock/animal.controller';

export default {
  Query: {
    animals: async () => {
      try {
        return {
          success: true,
          message: 'Success',
          animals: await AnimalController.list()
        };
      } catch (error) {
        return { success: false, message: error.message, animals: [] };
      }
    }
  },
  Mutation: {
    upsertAnimal: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Хадгалагдлаа',
          animal: await AnimalController.upsert(doc)
        };
      } catch (error) {
        return { success: false, message: error.message, animal: null };
      }
    }
  }
};
