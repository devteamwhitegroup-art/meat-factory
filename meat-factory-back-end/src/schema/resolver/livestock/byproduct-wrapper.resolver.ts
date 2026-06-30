import { ByproductWrapperController } from "../../../controller/livestock/byproduct-wrapper.controller";
import { AnimalModel } from "../../../models/livestock/animal.model";
import { ByproductWrapperModel } from "../../../models/livestock/byproduct-wrapper.model";
import {
  TCreateByproductWrapper,
  TGetByproductWrappers,
  TUpdateByproductWrapper,
} from "../../../types/livestock/byproduct-wrapper.type";
import { wrapList, wrapOne, wrapVoid } from "../../../utils";

// Cache for animalType lookup when the wrapper was loaded without its animal
// include (e.g. through a nested association).
async function loadAnimal(
  wrapper: ByproductWrapperModel,
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
      return animal?.name ?? null;
    },
    animal: async (wrapper: ByproductWrapperModel) => {
      return await loadAnimal(wrapper);
    },
  },
  Query: {
    byproductWrappers: wrapList(
      "byproductWrappers",
      (doc: TGetByproductWrappers) => ByproductWrapperController.list(doc),
    ),
    byproductWrapper: wrapOne("byproductWrapper", ({ id }: { id: string }) =>
      ByproductWrapperController.getById(id),
    ),
  },
  Mutation: {
    createByproductWrapper: wrapOne(
      "byproductWrapper",
      (doc: TCreateByproductWrapper) => ByproductWrapperController.create(doc),
      "Багц нэмэгдлээ",
    ),
    updateByproductWrapper: wrapOne(
      "byproductWrapper",
      (doc: TUpdateByproductWrapper) => ByproductWrapperController.update(doc),
      "Багц шинэчлэгдлээ",
    ),
    deleteByproductWrapper: wrapVoid(
      "Багц устгагдлаа",
      ({ id }: { id: string }) => ByproductWrapperController.remove(id),
    ),
  },
};
