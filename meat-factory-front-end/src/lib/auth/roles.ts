export type StaffRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MODERATOR"
  | "MANAGER"
  | "GUARD"
  | "SCALE"
  | "STOREKEEPER";

// Match the back-end @adminAuth(permissions:[...]) lists exactly.
export const CAPS = {
  createRegistration: [
    "GUARD",
    "STOREKEEPER",
    "MANAGER",
    "SUPER_ADMIN",
    "SCALE",
  ],
  // Anyone on the floor except the gate guard can run the scale — cover for
  // shifts where the named SCALE operator isn't around.
  weigh: [
    "SCALE",
    "STOREKEEPER",
    "MODERATOR",
    "MANAGER",
    "ADMIN",
    "SUPER_ADMIN",
  ],
  byproduct: ["STOREKEEPER", "MANAGER", "SUPER_ADMIN"],
  verify: ["STOREKEEPER", "MANAGER", "ADMIN", "SUPER_ADMIN"],
  settle: ["STOREKEEPER", "MANAGER", "SUPER_ADMIN"],
  // Read-only access to the settlement page — SCALE included so weighers can
  // verify their own per-entry name is correct on the final receipt.
  settleView: ["STOREKEEPER", "MANAGER", "ADMIN", "SUPER_ADMIN", "SCALE"],
  cancelRegistration: ["MANAGER", "SUPER_ADMIN"],
  herders: ["SUPER_ADMIN", "ADMIN", "MANAGER", "GUARD"],
  herderAddresses: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
  customers: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
  sales: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
  shipments: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"],
  inventory: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"],
  inventoryAdjust: ["MANAGER", "SUPER_ADMIN"],
  byproductConstants: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
  animals: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
  // System-wide thresholds: storage capacity, alert threshold, cargo capacity.
  settings: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
  dashboard: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
  monthlyBudgets: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
  admins: ["SUPER_ADMIN", "MANAGER"],
  deleteAdmin: ["SUPER_ADMIN"],
} as const satisfies Record<string, readonly StaffRole[]>;

export type Capability = keyof typeof CAPS;

export function can(role: string | null | undefined, cap: Capability): boolean {
  if (!role) return false;
  return (CAPS[cap] as readonly string[]).includes(role);
}

// Operator roles are single-purpose, on-site stations (gate / scale / store).
// They get a minimal "kiosk" shell. Office roles get the full sidebar.
const OPERATOR_ROLES: readonly StaffRole[] = ["GUARD", "SCALE", "STOREKEEPER"];

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
  { href: "/herders", label: "Малчид" },
  { href: "/herder-addresses", label: "Малчны хаягууд" },
  { href: "/customers", label: "Харилцагч" },
  { href: "/sales", label: "Гүйлгээ" },
  { href: "/shipments/export", label: "Экспортын ачилт" },
  { href: "/shipments/domestic", label: "Дотоод ачилт" },
  { href: "/inventory", label: "Нөөц" },
  { href: "/byproduct-constants", label: "Дайвар норм" },
  { href: "/animals", label: "Малын тохиргоо" },
  { href: "/monthly-budgets", label: "Сарын төсөв" },
  { href: "/settings", label: "Систем тохиргоо" },
  { href: "/admins", label: "Хэрэглэгч" },
];

export const NAV_BY_ROLE: Record<StaffRole, NavItem[]> = {
  SUPER_ADMIN: OFFICE_NAV,
  ADMIN: OFFICE_NAV,
  MANAGER: OFFICE_NAV,
  MODERATOR: [{ href: "/registrations", label: "Бүртгэл" }],
  GUARD: [
    { href: "/registrations/new", label: "Шинэ бүртгэл" },
    { href: "/registrations", label: "Миний бүртгэл" },
  ],
  SCALE: [
    { href: "/registrations?stage=registered", label: "Жинлэх дараалал" },
    { href: "/registrations", label: "Бүртгэл" },
    { href: "/registrations/new", label: "Шинэ бүртгэл" },
  ],
  STOREKEEPER: [
    { href: "/registrations/new", label: "Шинэ бүртгэл" },
    { href: "/registrations?stage=in_process", label: "Тооцоо хүлээгдэж буй" },
    { href: "/registrations", label: "Бүртгэл" },
    { href: "/inventory", label: "Нөөц" },
    { href: "/shipments/export", label: "Экспортын ачилт" },
    { href: "/shipments/domestic", label: "Дотоод ачилт" },
  ],
};

export function navItemsFor(role: string | null | undefined): NavItem[] {
  if (!role) return [];
  return NAV_BY_ROLE[role as StaffRole] ?? [];
}

// Active-state test for nav links: matches the exact path or any sub-route,
// ignoring the query string. Shared by Topbar and Sidebar.
export function navIsActive(pathname: string, href: string): boolean {
  const path = href.split("?")[0];
  return pathname === path || pathname.startsWith(path + "/");
}
