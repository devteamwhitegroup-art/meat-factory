import { AnimalController } from "../../../controller/livestock/animal.controller";
import { TUpsertAnimal } from "../../../types/livestock/animal.type";
import { wrapItems, wrapOne } from "../../../utils";

export default {
  Query: {
    animals: wrapItems("animals", () => AnimalController.list()),
  },
  Mutation: {
    upsertAnimal: wrapOne(
      "animal",
      (doc: TUpsertAnimal) => AnimalController.upsert(doc),
      "Хадгалагдлаа",
    ),
  },
};
