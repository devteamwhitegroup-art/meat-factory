// Mongolian Cyrillic labels for every back-end enum. Single source of
// truth — UI components must NOT hardcode Cyrillic enum strings.

// Roles and factories are admin-managed catalogues: their names come from
// the `roles` / `factories` queries (see src/lib/factory/), not from here.

// Animal labels are not enums: the catalogue stores the Mongolian name as
// `Animal.name`, which is the value carried by `animalType` on every record —
// render it directly, no map.

export const REGISTRATION_STATUS_MN: Record<string, string> = {
  REGISTERED: "Бүртгэгдсэн",
  WEIGHED: "Жинлэсэн",
  VERIFIED: "Баталгаажсан",
  PAYMENT_PENDING: "Төлбөр хүлээгдэж буй",
  PARTIALLY_SETTLED: "Хэсэгчлэн төлсөн",
  SETTLED: "Төлбөр хийгдсэн",
  CANCELLED: "Цуцлагдсан",
};

// Vet's ruling on one medical certificate number (checked against the
// government service).
export const MEDICAL_NUMBER_STATUS_MN: Record<string, string> = {
  PENDING: "Баталгаажилт хийгдээгүй",
  APPROVED: "Баталгаажсан",
  REJECTED: "Татгалзсан",
};

export const MEDICAL_NUMBER_STATUS_COLOR: Record<string, string> = {
  PENDING: "border-0 bg-amber-500/12 text-amber-700 dark:text-amber-400",
  APPROVED: "border-0 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  REJECTED: "border-0 bg-red-500/12 text-red-700 dark:text-red-400",
};

export const CHANGE_REQUEST_STATUS_MN: Record<string, string> = {
  PENDING: "Хүлээгдэж буй",
  APPROVED: "Зөвшөөрсөн",
  REJECTED: "Татгалзсан",
};

// Same PENDING / APPROVED / REJECTED palette.
export const CHANGE_REQUEST_STATUS_COLOR = MEDICAL_NUMBER_STATUS_COLOR;

export const PAYMENT_STATUS_MN: Record<string, string> = {
  PAID: "Төлбөр хийсэн",
  PARTIALLY_PAID: "Хэсэгчлэн төлсөн",
  PENDING: "Хүлээгдэж буй",
};

export const SHIPMENT_STATUS_MN: Record<string, string> = {
  PENDING: "Хүлээгдэж буй",
  LOADED: "Ачигдсан",
  DELIVERED: "Хүргэгдсэн",
};

export const SHIPMENT_CATEGORY_MN: Record<string, string> = {
  EXPORT: "Экспорт",
  DOMESTIC: "Дотоод",
};

export const DOMESTIC_MARKET_MN: Record<string, string> = {
  ULAANBAATAR: "Улаанбаатар",
  LOCAL: "Орон нутаг",
};

export const CUSTOMER_KIND_MN: Record<string, string> = {
  LOCAL_BROKER: "Орон нутгийн брокер",
  ULAANBAATAR_BROKER: "Улаанбаатарын брокер",
  FACTORY: "Үйлдвэр",
};

// Distinct badge colors per kind — shared by the customer list + pickers.
export const CUSTOMER_KIND_COLOR: Record<string, string> = {
  LOCAL_BROKER: "border-0 bg-amber-500/12 text-amber-700 dark:text-amber-400",
  ULAANBAATAR_BROKER: "border-0 bg-blue-500/12 text-blue-700 dark:text-blue-400",
  FACTORY: "border-0 bg-slate-500/12 text-slate-700 dark:text-slate-300",
};

export const MOVEMENT_TYPE_MN: Record<string, string> = {
  IN: "Орлого",
  OUT: "Зарлага",
  ADJUSTMENT: "Тохируулга",
};

export const MOVEMENT_SOURCE_MN: Record<string, string> = {
  VERIFICATION: "Баталгаажуулалт",
  SETTLEMENT: "Тооцоо",
  BYPRODUCT: "Дайвар хадгалалт",
  WEIGHING: "Жинлэлт (задалсан мах)",
  TRANSFER: "Дайвар шилжүүлэг",
  PROCESSING: "Дайвар задлалт",
  SHIPMENT: "Ачилт",
  MANUAL: "Гар тохируулга",
};

export const PRODUCT_TYPE_MN: Record<string, string> = {
  MEAT: "Мах",
  BYPRODUCT: "Дайвар",
};

export const WEIGHING_AUDIT_ACTION_MN: Record<string, string> = {
  CREATE: "Нэмсэн",
  UPDATE: "Засварласан",
  DELETE: "Устгасан",
};
