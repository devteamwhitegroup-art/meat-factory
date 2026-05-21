export type StaffRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'MANAGER'
  | 'GUARD'
  | 'SCALE'
  | 'STOREKEEPER';

// Match the back-end @adminAuth(permissions:[...]) lists exactly.
export const CAPS = {
  createRegistration: ['GUARD', 'MANAGER', 'SUPER_ADMIN'],
  weigh: ['SCALE', 'MANAGER', 'SUPER_ADMIN'],
  byproduct: ['STOREKEEPER', 'MANAGER', 'SUPER_ADMIN'],
  verify: ['STOREKEEPER', 'SCALE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  settle: ['STOREKEEPER', 'MANAGER', 'SUPER_ADMIN'],
  cancelRegistration: ['MANAGER', 'SUPER_ADMIN'],
  customers: ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  sales: ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  shipments: ['MANAGER', 'STOREKEEPER', 'ADMIN', 'SUPER_ADMIN'],
  inventory: ['MANAGER', 'STOREKEEPER', 'ADMIN', 'SUPER_ADMIN'],
  inventoryAdjust: ['MANAGER', 'SUPER_ADMIN'],
  dashboard: ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  admins: ['SUPER_ADMIN', 'MANAGER'],
  deleteAdmin: ['SUPER_ADMIN'],
} as const satisfies Record<string, readonly StaffRole[]>;

export type Capability = keyof typeof CAPS;

export function can(role: string | null | undefined, cap: Capability): boolean {
  if (!role) return false;
  return (CAPS[cap] as readonly string[]).includes(role);
}

// Operator roles are single-purpose, on-site stations (gate / scale / store).
// They get a minimal "kiosk" shell. Office roles get the full sidebar.
const OPERATOR_ROLES: readonly StaffRole[] = ['GUARD', 'SCALE', 'STOREKEEPER'];

export function isOperatorRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return (OPERATOR_ROLES as readonly string[]).includes(role);
}

export type NavItem = { href: string; label: string };

// Task-focused navigation per role. Operator roles get a tiny list aimed at
// their single job; office roles get the full menu. This is UX scoping only —
// the back-end @adminAuth(permissions) remains the real access boundary.
const OFFICE_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Тайлан' },
  { href: '/registrations', label: 'Бүртгэл' },
  { href: '/herders', label: 'Малчид' },
  { href: '/customers', label: 'Харилцагч' },
  { href: '/sales', label: 'Гүйлгээ' },
  { href: '/shipments', label: 'Ачилт' },
  { href: '/inventory', label: 'Нөөц' },
  { href: '/admins', label: 'Хэрэглэгч' },
];

export const NAV_BY_ROLE: Record<StaffRole, NavItem[]> = {
  SUPER_ADMIN: OFFICE_NAV,
  ADMIN: OFFICE_NAV.filter((n) => n.href !== '/admins').concat({
    href: '/admins',
    label: 'Хэрэглэгч',
  }),
  MANAGER: OFFICE_NAV,
  MODERATOR: [{ href: '/registrations', label: 'Бүртгэл' }],
  GUARD: [
    { href: '/registrations/new', label: 'Шинэ бүртгэл' },
    { href: '/registrations', label: 'Миний бүртгэл' },
  ],
  SCALE: [
    { href: '/registrations?status=WEIGHING', label: 'Жигнэх дараалал' },
    { href: '/registrations', label: 'Бүртгэл' },
  ],
  STOREKEEPER: [
    { href: '/registrations?status=WEIGHED', label: 'Тооцоо хүлээгдэж буй' },
    { href: '/registrations', label: 'Бүртгэл' },
    { href: '/inventory', label: 'Нөөц' },
    { href: '/shipments', label: 'Ачилт' },
  ],
};

export function navItemsFor(role: string | null | undefined): NavItem[] {
  if (!role) return [];
  return NAV_BY_ROLE[role as StaffRole] ?? [];
}
