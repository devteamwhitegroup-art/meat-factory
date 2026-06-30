// Mongolian Cyrillic labels for every back-end enum. Single source of
// truth — UI components must NOT hardcode Cyrillic enum strings.

export const ROLE_MN: Record<string, string> = {
  SUPER_ADMIN: "Систем админ",
  ADMIN: "Админ",
  MODERATOR: "Модератор",
  MANAGER: "Менежер",
  GUARD: "Харуул",
  SCALE: "Жинч",
  STOREKEEPER: "Нярав",
};

// Animal-type display names are admin-editable and come from the Animals
// catalogue (Animal.name) via useAnimalCatalog().animalName / getAnimalNames().

export const REGISTRATION_STATUS_MN: Record<string, string> = {
  REGISTERED: "Бүртгэгдсэн",
  WEIGHED: "Жинлэсэн",
  VERIFIED: "Баталгаажсан",
  PAYMENT_PENDING: "Төлбөр хүлээгдэж буй",
  PARTIALLY_SETTLED: "Хэсэгчлэн төлсөн",
  SETTLED: "Төлбөр хийгдсэн",
  CANCELLED: "Цуцлагдсан",
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
  SETTLEMENT: "Тооцоо",
  SHIPMENT: "Ачилт",
  MANUAL: "Гар",
};

export const PRODUCT_TYPE_MN: Record<string, string> = {
  MEAT: "Мах",
  BYPRODUCT: "Дайвар",
};

// Deprecated — prefer useAnimalCatalog() so the list comes from the DB
// (Animals table). Kept here only as a fallback ordering for sorts.
export const ANIMAL_TYPES = ["COW", "SHEEP", "HORSE", "GOAT", "CAMEL"] as const;
