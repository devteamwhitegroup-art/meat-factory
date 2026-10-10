// Per-animal-type catalogue config. The ANIMAL_TYPE enum was removed — the
// unique `name` (Үхэр, Хонь, Адуу, …) is now the identity, admin-managed.
//   isExport — meat allowed on export shipments (only horse, for now).
//   pricePerAnimal — slaughter (бой) cost per head; pre-fills settlement.
// Hierarchy: Animal → ByproductWrapper → ByproductConstant.
export type TAnimal = {
  id: string;
  name: string;
  isExport: boolean;
  pricePerAnimal: number;
  // Carcass-to-saleable yield (%) applied when meat hits inventory.
  yieldPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TUpsertAnimal = {
  // Provide id to edit (incl. rename); omit to create a new animal by name.
  id?: string;
  name: string;
  isExport?: boolean;
  pricePerAnimal?: number;
  yieldPercent?: number;
  isActive?: boolean;
};
