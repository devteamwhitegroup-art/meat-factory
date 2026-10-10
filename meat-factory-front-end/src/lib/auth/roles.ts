// ADMIN — everything, every factory. STOREKEEPER (нярав) — all data entry:
// intake, weighing, гэдэс, price negotiation, stock, shipments. ACCOUNTANT
// (нягтлан) — money. DOCTOR (эмч) — medical number.
export type StaffRole = "ADMIN" | "STOREKEEPER" | "ACCOUNTANT" | "DOCTOR";

// Match the back-end @auth(permissions:[...]) lists exactly.
export const CAPS = {
  createRegistration: ["STOREKEEPER", "ADMIN"],
  weigh: ["STOREKEEPER", "ADMIN"],
  // Fixing a weighing entry once the registration is past REGISTERED —
  // matches WeighingController._assertWeighingEditable.
  weighFix: ["ADMIN"],
  byproduct: ["STOREKEEPER", "ADMIN"],
  verify: ["STOREKEEPER", "ADMIN"],
  // Add / remove (unchecked) medical numbers on a registration.
  medicalNumber: ["STOREKEEPER", "DOCTOR", "ADMIN"],
  // Rule on numbers (gov-service check) + the /medical-numbers worklist.
  medicalCheck: ["DOCTOR", "ADMIN"],
  // Create the herder invoice; view the settlement page.
  settle: ["STOREKEEPER", "ACCOUNTANT", "ADMIN"],
  // Pay / release hold / payment proofs.
  pay: ["ACCOUNTANT", "ADMIN"],
  storekeeperSign: ["STOREKEEPER", "ADMIN"],
  cancelRegistration: ["ADMIN"],
  herders: ["STOREKEEPER", "ADMIN"],
  herderEdit: ["STOREKEEPER", "ADMIN"],
  herderAddresses: ["STOREKEEPER", "ADMIN"],
  customers: ["ACCOUNTANT", "ADMIN"],
  sales: ["ACCOUNTANT", "ADMIN"],
  shipments: ["STOREKEEPER", "ADMIN"],
  inventory: ["STOREKEEPER", "ADMIN"],
  inventoryAdjust: ["STOREKEEPER", "ADMIN"],
  byproductConstants: ["ADMIN"],
  animals: ["ADMIN"],
  // System-wide thresholds: storage capacity, alert threshold, cargo capacity.
  settings: ["ADMIN"],
  dashboard: ["ACCOUNTANT", "ADMIN"],
  // Byproduct factory (FACTORY_3) disassembly batches; F1/F2 → F3 transfer.
  byproductProcessing: ["STOREKEEPER", "ADMIN"],
  byproductTransfer: ["STOREKEEPER", "ADMIN"],
} as const satisfies Record<string, readonly StaffRole[]>;

export type Capability = keyof typeof CAPS;

// Admin spans every factory; every other role belongs to one.
// Mirrors BE CROSS_FACTORY_ROLES.
const CROSS_FACTORY_ROLES: readonly StaffRole[] = ["ADMIN"];

export function isCrossFactoryRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return (CROSS_FACTORY_ROLES as readonly string[]).includes(role);
}

export function can(role: string | null | undefined, cap: Capability): boolean {
  if (!role) return false;
  return (CAPS[cap] as readonly string[]).includes(role);
}

// Single-purpose roles get a minimal "kiosk" shell (top-bar links only).
// Everyone else gets the full sidebar.
const OPERATOR_ROLES: readonly StaffRole[] = ["DOCTOR"];

export function isOperatorRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return (OPERATOR_ROLES as readonly string[]).includes(role);
}

export type NavItem = { href: string; label: string };

// Task-focused navigation per role. Operator roles get a tiny list aimed at
// their single job; office roles get the full menu. This is UX scoping only —
// the back-end @adminAuth(permissions) remains the real access boundary.
const OFFICE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Тайлан" },
  { href: "/registrations", label: "Бүртгэл" },
  { href: "/medical-numbers", label: "Эмнэлгийн дугаар" },
  { href: "/herders", label: "Малчид" },
  { href: "/herder-addresses", label: "Малчны хаягууд" },
  { href: "/customers", label: "Харилцагч" },
  { href: "/sales", label: "Гүйлгээ" },
  { href: "/shipments/export", label: "Экспортын ачилт" },
  { href: "/shipments/domestic", label: "Дотоод ачилт" },
  { href: "/inventory", label: "Нөөц" },
  { href: "/byproduct-constants", label: "Дайвар норм" },
  { href: "/animals", label: "Малын тохиргоо" },
  { href: "/settings", label: "Систем тохиргоо" },
];

const PROCESSING_NAV: NavItem = {
  href: "/byproduct-processing",
  label: "Дайвар задлалт",
};

// FACTORY_3 never touches livestock — its storekeepers get this menu.
const BYPRODUCT_FACTORY_NAV: NavItem[] = [
  PROCESSING_NAV,
  { href: "/inventory", label: "Нөөц" },
  { href: "/shipments/domestic", label: "Дотоод ачилт" },
];

export const NAV_BY_ROLE: Record<StaffRole, NavItem[]> = {
  ADMIN: [...OFFICE_NAV, PROCESSING_NAV],
  STOREKEEPER: [
    { href: "/registrations/new", label: "Шинэ бүртгэл" },
    { href: "/registrations?stage=registered", label: "Жинлэх дараалал" },
    { href: "/registrations?stage=in_process", label: "Тооцоо хүлээгдэж буй" },
    { href: "/registrations", label: "Бүртгэл" },
    { href: "/herders", label: "Малчид" },
    { href: "/herder-addresses", label: "Малчны хаягууд" },
    { href: "/inventory", label: "Нөөц" },
    { href: "/shipments/export", label: "Экспортын ачилт" },
    { href: "/shipments/domestic", label: "Дотоод ачилт" },
  ],
  ACCOUNTANT: [
    { href: "/sales", label: "Гүйлгээ" },
    { href: "/registrations", label: "Бүртгэл" },
    { href: "/customers", label: "Харилцагч" },
    { href: "/dashboard", label: "Тайлан" },
  ],
  DOCTOR: [
    { href: "/medical-numbers", label: "Эмнэлгийн дугаар" },
    { href: "/registrations", label: "Бүртгэл" },
  ],
};

export function navItemsFor(
  role: string | null | undefined,
  factory?: string | null,
): NavItem[] {
  if (!role) return [];
  if (factory === "FACTORY_3" && can(role, "byproductProcessing"))
    return BYPRODUCT_FACTORY_NAV;
  return NAV_BY_ROLE[role as StaffRole] ?? [];
}

// Active-state test for nav links: matches the exact path or any sub-route,
// ignoring the query string. Shared by Topbar and Sidebar.
export function navIsActive(pathname: string, href: string): boolean {
  const path = href.split("?")[0];
  return pathname === path || pathname.startsWith(path + "/");
}
