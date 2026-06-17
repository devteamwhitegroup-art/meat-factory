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

export const ANIMAL_MN: Record<string, string> = {
  COW: "Үхэр",
  SHEEP: "Хонь",
  HORSE: "Адуу",
  GOAT: "Ямаа",
  CAMEL: "Тэмээ",
};

export const BYPRODUCT_MN: Record<string, string> = {
  HEART: "Зүрх",
  LUNG: "Уушги",
  LIVER: "Элэг",
  KIDNEY: "Бөөр",
  STOMACH: "Гүзээ",
  INTESTINE: "Гэдэс",
  TONGUE: "Хэл",
  HEAD: "Тархи",
  TAIL: "Сүүл",
  LEG: "Шийр",
  BLOOD: "Цус",
  HIDE: "Арьс",
  OTHER: "Бусад",
};

export const REGISTRATION_STATUS_MN: Record<string, string> = {
  REGISTERED: "Бүртгэгдсэн",
  WEIGHED: "Жинлэсэн",
  VERIFIED: "Баталгаажсан",
  PAYMENT_PENDING: "Төлбөр хүлээгдэж буй",
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

export const CUSTOMER_KIND_MN: Record<string, string> = {
  BROKER: "Зуучлагч",
  FACTORY: "Үйлдвэр",
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

export const BYPRODUCT_TYPES = [
  "HEART",
  "LUNG",
  "LIVER",
  "KIDNEY",
  "STOMACH",
  "INTESTINE",
  "TONGUE",
  "HEAD",
  "TAIL",
  "LEG",
  "BLOOD",
  "HIDE",
  "OTHER",
] as const;
