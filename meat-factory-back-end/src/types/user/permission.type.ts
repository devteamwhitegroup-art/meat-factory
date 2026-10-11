// The permission catalogue. Every guarded GraphQL field names one or more of
// these in `@auth(permissions: [...])`; a Role is just a named set of them that
// admin assembles in the UI. Add a key here (+ a label below) when a new
// guarded operation needs its own switch — never a new hard-coded role.
export enum PERMISSION {
  // Бүртгэл (livestock intake)
  REGISTRATION_CREATE = "REGISTRATION_CREATE",
  REGISTRATION_WEIGH = "REGISTRATION_WEIGH",
  REGISTRATION_WEIGH_FIX = "REGISTRATION_WEIGH_FIX",
  REGISTRATION_VERIFY = "REGISTRATION_VERIFY",
  REGISTRATION_CANCEL = "REGISTRATION_CANCEL",
  CHANGE_REQUEST_REVIEW = "CHANGE_REQUEST_REVIEW",
  MEDICAL_NUMBER_ENTER = "MEDICAL_NUMBER_ENTER",
  MEDICAL_NUMBER_CHECK = "MEDICAL_NUMBER_CHECK",
  // Тооцоо (herder settlement)
  SETTLEMENT_CREATE = "SETTLEMENT_CREATE",
  SETTLEMENT_PAY = "SETTLEMENT_PAY",
  // Малчид, харилцагч
  HERDER_EDIT = "HERDER_EDIT",
  HERDER_MANAGE = "HERDER_MANAGE",
  CUSTOMER_MANAGE = "CUSTOMER_MANAGE",
  // Борлуулалт, ачилт
  SALES_MANAGE = "SALES_MANAGE",
  SHIPMENT_VIEW = "SHIPMENT_VIEW",
  SHIPMENT_MANAGE = "SHIPMENT_MANAGE",
  SHIPMENT_SALES = "SHIPMENT_SALES",
  // Нөөц, дайвар
  INVENTORY_VIEW = "INVENTORY_VIEW",
  INVENTORY_ADJUST = "INVENTORY_ADJUST",
  BYPRODUCT_TRANSFER = "BYPRODUCT_TRANSFER",
  BYPRODUCT_PROCESS = "BYPRODUCT_PROCESS",
  // Тайлан, тохиргоо
  DASHBOARD_VIEW = "DASHBOARD_VIEW",
  CATALOG_MANAGE = "CATALOG_MANAGE",
  SETTINGS_MANAGE = "SETTINGS_MANAGE",
  STAFF_MANAGE = "STAFF_MANAGE",
}

export type TPermissionGroup = {
  group: string;
  items: { key: PERMISSION; label: string }[];
};

// Grouped + labelled for the role editor (served by `permissionCatalog`).
export const PERMISSION_GROUPS: TPermissionGroup[] = [
  {
    group: "Бүртгэл",
    items: [
      { key: PERMISSION.REGISTRATION_CREATE, label: "Бүртгэл үүсгэх, засах, засварын хүсэлт илгээх" },
      { key: PERMISSION.REGISTRATION_WEIGH, label: "Жинлэх, үнэ тохирох, гэдэс тоолох" },
      { key: PERMISSION.REGISTRATION_WEIGH_FIX, label: "Жинлэлт дууссаны дараа жин засах" },
      { key: PERMISSION.REGISTRATION_VERIFY, label: "Баталгаажуулах" },
      { key: PERMISSION.REGISTRATION_CANCEL, label: "Бүртгэл цуцлах" },
      { key: PERMISSION.CHANGE_REQUEST_REVIEW, label: "Засварын хүсэлт шийдвэрлэх" },
      { key: PERMISSION.MEDICAL_NUMBER_ENTER, label: "Эмнэлгийн дугаар нэмэх, хасах" },
      { key: PERMISSION.MEDICAL_NUMBER_CHECK, label: "Эмнэлгийн дугаар шалгах (жагсаалт)" },
    ],
  },
  {
    group: "Тооцоо",
    items: [
      { key: PERMISSION.SETTLEMENT_CREATE, label: "Малчны тооцоо үүсгэх, харах" },
      { key: PERMISSION.SETTLEMENT_PAY, label: "Төлбөр хийх, барьцаа чөлөөлөх, баримт, гарын үсэг" },
    ],
  },
  {
    group: "Малчид, харилцагч",
    items: [
      { key: PERMISSION.HERDER_EDIT, label: "Малчин нэмэх, засах" },
      { key: PERMISSION.HERDER_MANAGE, label: "Малчдын жагсаалт, статистик, устгах" },
      { key: PERMISSION.CUSTOMER_MANAGE, label: "Харилцагч удирдах" },
    ],
  },
  {
    group: "Борлуулалт, ачилт",
    items: [
      { key: PERMISSION.SALES_MANAGE, label: "Гүйлгээ (борлуулалт) удирдах" },
      { key: PERMISSION.SHIPMENT_VIEW, label: "Ачилт харах" },
      { key: PERMISSION.SHIPMENT_MANAGE, label: "Ачилт үүсгэх, ачих, зураг" },
      { key: PERMISSION.SHIPMENT_SALES, label: "Ачилтын борлуулалт, тайлан" },
    ],
  },
  {
    group: "Нөөц, дайвар",
    items: [
      { key: PERMISSION.INVENTORY_VIEW, label: "Нөөц, хөдөлгөөн харах" },
      { key: PERMISSION.INVENTORY_ADJUST, label: "Нөөцийн гар тохируулга" },
      { key: PERMISSION.BYPRODUCT_TRANSFER, label: "Дайвар дайврын үйлдвэрт илгээх" },
      { key: PERMISSION.BYPRODUCT_PROCESS, label: "Дайвар задлах, шинжилгээ" },
    ],
  },
  {
    group: "Тайлан, тохиргоо",
    items: [
      { key: PERMISSION.DASHBOARD_VIEW, label: "Тайлан, төсөв, нөөцийн үнэлгээ" },
      { key: PERMISSION.CATALOG_MANAGE, label: "Мал, дайврын норм, малчны хаягийн каталог" },
      { key: PERMISSION.SETTINGS_MANAGE, label: "Систем тохиргоо, принтер, үйлдвэр" },
      { key: PERMISSION.STAFF_MANAGE, label: "Ажилтан, эрх удирдах" },
    ],
  },
];

export const ALL_PERMISSIONS: readonly PERMISSION[] = Object.values(PERMISSION);
