import { ByproductWrapperController } from '../../../controller/livestock/byproduct-wrapper.controller';
import { AnimalModel } from '../../../models/livestock/animal.model';
import { ByproductWrapperModel } from '../../../models/livestock/byproduct-wrapper.model';

// Cache for animalType lookup when the wrapper was loaded without its animal
// include (e.g. through a nested association).
async function loadAnimal(
  wrapper: ByproductWrapperModel
): Promise<AnimalModel | null> {
  if (wrapper.animal) return wrapper.animal;
  if (!wrapper.animalId) return null;
  return await AnimalModel.findByPk(wrapper.animalId);
}

export default {
  ByproductWrapper: {
    // Virtual field — keeps the existing GraphQL surface (animalType still
    // available) but the column is actually animal.animalType through the FK.
    animalType: async (wrapper: ByproductWrapperModel) => {
      const animal = await loadAnimal(wrapper);
      return animal?.animalType ?? null;
    },
    animal: async (wrapper: ByproductWrapperModel) => {
      return await loadAnimal(wrapper);
    }
  },
  Query: {
    byproductWrappers: async (_, doc) => {
      try {
        const { rows, count } = await ByproductWrapperController.list(doc);
        return {
          success: true,
          message: 'Success',
          byproductWrappers: rows,
          count
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          byproductWrappers: [],
          count: 0
        };
      }
    },
    byproductWrapper: async (_, { id }) => {
      try {
        return {
          success: true,
          message: 'Success',
          byproductWrapper: await ByproductWrapperController.getById(id)
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          byproductWrapper: null
        };
      }
    }
  },
  Mutation: {
    createByproductWrapper: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Багц нэмэгдлээ',
          byproductWrapper: await ByproductWrapperController.create(doc)
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          byproductWrapper: null
        };
      }
    },
    updateByproductWrapper: async (_, doc) => {
      try {
        return {
          success: true,
          message: 'Багц шинэчлэгдлээ',
          byproductWrapper: await ByproductWrapperController.update(doc)
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          byproductWrapper: null
        };
      }
    },
    deleteByproductWrapper: async (_, { id }) => {
      try {
        await ByproductWrapperController.remove(id);
        return { success: true, message: 'Багц устгагдлаа' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
};
