// Mongolian Cyrillic labels for every back-end enum. Single source of
// truth — UI components must NOT hardcode Cyrillic enum strings.

export const ROLE_MN: Record<string, string> = {
  ADMIN: "Админ",
  STOREKEEPER: "Нярав",
  ACCOUNTANT: "Нягтлан",
  DOCTOR: "Эмч",
};

// Factory display names — rename here, never in the BE enum.
export const FACTORY_MN: Record<string, string> = {
  FACTORY_1: "Урд үйлдвэр",
  FACTORY_2: "Хойт үйлдвэр",
  FACTORY_3: "Дайвар үйлдвэр",
};

// FACTORY_3 is the byproduct factory: it receives counted гэдэс from 1 & 2 and
// disassembles/weighs it; it never receives livestock. Mirrors BE.
export const BYPRODUCT_FACTORY = "FACTORY_3";
// Factories that take livestock intake (registration form picker).
export const INTAKE_FACTORIES = ["FACTORY_1", "FACTORY_2"];

// FACTORY_2 only receives pre-butchered meat: no stamp, no slaughter cost, no
// verify step — meat + гэдэс are stocked when weighing is finished and
// finance settles later. Mirrors BE isPreButchered().
export const isPreButchered = (factory?: string | null): boolean =>
  factory === "FACTORY_2";

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
  PENDING: "border-0 bg-amber-100 text-amber-800",
  APPROVED: "border-0 bg-emerald-100 text-emerald-800",
  REJECTED: "border-0 bg-red-100 text-red-800",
};

export const PAYMENT_STATUS_MN: Record<string, string> = {
  PAID: "Төлбөр хийсэн",
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
  LOCAL_BROKER: "border-0 bg-amber-100 text-amber-800",
  ULAANBAATAR_BROKER: "border-0 bg-blue-100 text-blue-800",
  FACTORY: "border-0 bg-slate-200 text-slate-800",
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
  WEIGHING: "Жинлэлт (Үйлдвэр 2)",
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
