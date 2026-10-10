export enum ADMIN_ROLE {
  // Owner/admin — everything, every factory.
  ADMIN = "ADMIN",
  // Нярав — all data entry: intake, weighing, гэдэс, price negotiation, stock.
  STOREKEEPER = "STOREKEEPER",
  // Нягтлан — money: herder payouts, sales, budgets.
  ACCOUNTANT = "ACCOUNTANT",
  // Эмч — registers and approves the medical number.
  DOCTOR = "DOCTOR",
}

// Factory CODES — they are GraphQL enum values and DB enum labels, so they
// must stay ASCII identifiers (no Cyrillic, no spaces) and never change.
// Display names live ONLY in the FE label map (FACTORY_MN in
// meat-factory-front-end/src/lib/format/enum.ts) — rename factories there.
//   FACTORY_1 — live-animal slaughter      (Урд үйлдвэр)
//   FACTORY_2 — pre-butchered meat intake  (Хойт үйлдвэр)
//   FACTORY_3 — byproduct factory: receives counted гэдэс from 1 & 2,
//               disassembles and weighs it (Дайвар үйлдвэр)
export enum FACTORY {
  FACTORY_1 = "FACTORY_1",
  FACTORY_2 = "FACTORY_2",
  FACTORY_3 = "FACTORY_3",
}

export const BYPRODUCT_FACTORY = FACTORY.FACTORY_3;

// Owner/admin span both factories; every other role belongs to exactly one.
export const CROSS_FACTORY_ROLES: readonly ADMIN_ROLE[] = [ADMIN_ROLE.ADMIN];

export type TCreateAdmin = {
  param: string;
  password: string;
  role?: ADMIN_ROLE;
  factory?: FACTORY | null;
};

export type TAdmin = {
  id: string;
  param: string;
  password: string;
  role: ADMIN_ROLE;
  factory: FACTORY | null;
};

export type TAdminLoginInput = {
  param: string;
  password: string;
};
