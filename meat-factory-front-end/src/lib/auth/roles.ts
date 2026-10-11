import type { Permission } from "@/lib/gql/graphql";

export type { Permission };

// Roles are admin-managed on the back-end; the FE only ever sees the
// permission keys of the signed-in account (mf_perms cookie, set at login).
// This is UX scoping — the back-end @auth(permissions) is the real boundary.
export function can(
  perms: readonly string[] | null | undefined,
  ...anyOf: Permission[]
): boolean {
  if (!perms) return false;
  return anyOf.some((p) => perms.includes(p));
}

// Pre-butchered intake carries weights + prices, so it also needs the
// weighing permission. Mirrors RegistrationController.create.
export function canCreateRegistration(
  perms: readonly string[] | null | undefined,
  factoryKind: string | null | undefined,
): boolean {
  if (!can(perms, "REGISTRATION_CREATE")) return false;
  return factoryKind !== "PRE_BUTCHERED" || can(perms, "REGISTRATION_WEIGH");
}

export type NavItem = { href: string; label: string };
type NavEntry = NavItem & { perms: Permission[]; livestock?: boolean };

// Main menu in display order; an item shows when the account holds ANY of
// its permissions. Sub-pages left out stay reachable by link.
const NAV: NavEntry[] = [
  { href: "/dashboard", label: "Тайлан", perms: ["DASHBOARD_VIEW"] },
  {
    href: "/registrations",
    label: "Бүртгэл",
    perms: [
      "REGISTRATION_CREATE",
      "REGISTRATION_WEIGH",
      "REGISTRATION_VERIFY",
      "SETTLEMENT_CREATE",
      "SETTLEMENT_PAY",
    ],
    livestock: true,
  },
  {
    href: "/medical-numbers",
    label: "Эмнэлгийн дугаар",
    perms: ["MEDICAL_NUMBER_CHECK"],
    livestock: true,
  },
  { href: "/sales", label: "Гүйлгээ", perms: ["SALES_MANAGE"] },
  { href: "/byproduct", label: "Дайвар", perms: ["BYPRODUCT_PROCESS"] },
  { href: "/inventory", label: "Нөөц", perms: ["INVENTORY_VIEW"] },
  { href: "/shipments", label: "Ачилт", perms: ["SHIPMENT_VIEW"] },
  { href: "/herders", label: "Малчид", perms: ["HERDER_MANAGE"] },
  { href: "/customers", label: "Харилцагч", perms: ["CUSTOMER_MANAGE"] },
  {
    href: "/change-requests",
    label: "Засварын хүсэлт",
    perms: ["CHANGE_REQUEST_REVIEW"],
  },
  {
    href: "/settings",
    label: "Систем тохиргоо",
    perms: ["SETTINGS_MANAGE", "STAFF_MANAGE", "CATALOG_MANAGE"],
  },
];

// Staff at a byproduct-kind site never touch livestock: those items drop and
// their own work (Дайвар) leads the menu.
export function navItemsFor(
  perms: readonly string[] | null | undefined,
  factoryKind: string | null | undefined,
): NavItem[] {
  const byproductSite = factoryKind === "BYPRODUCT";
  const items = NAV.filter(
    (n) => can(perms, ...n.perms) && !(byproductSite && n.livestock),
  ).map(({ href, label }) => ({ href, label }));
  if (byproductSite)
    items.sort((a, b) =>
      a.href === "/byproduct" ? -1 : b.href === "/byproduct" ? 1 : 0,
    );
  return items;
}

// Where `/` sends an account: its first menu item.
export function landingFor(
  perms: readonly string[] | null | undefined,
  factoryKind: string | null | undefined,
): string {
  return navItemsFor(perms, factoryKind)[0]?.href ?? "/registrations";
}

// ponytail: a menu of at most two destinations gets the single-purpose kiosk
// shell (slim top bar, no sidebar) — today that is эмч. Make it a role flag if
// the heuristic ever misfires.
export function isKioskNav(items: NavItem[]): boolean {
  return items.length <= 2;
}

// The single active nav link: among items whose path matches (exact or
// sub-route) AND whose query params all match the URL, the most specific
// (longest href) wins — so /registrations/new lights only "Шинэ бүртгэл", not
// every /registrations?stage=… link. Shared by Topbar and Sidebar.
export function activeNavHref(
  items: NavItem[],
  pathname: string,
  search: Pick<URLSearchParams, "get">,
): string | null {
  let best: string | null = null;
  for (const { href } of items) {
    const [path, query] = href.split("?");
    if (pathname !== path && !pathname.startsWith(path + "/")) continue;
    const want = [...new URLSearchParams(query)];
    if (want.some(([k, v]) => search.get(k) !== v)) continue;
    if (!best || href.length > best.length) best = href;
  }
  return best;
}

// Client-readable permission cookie (set by /api/login). Client components
// read it post-mount to gate actions without prop-drilling.
export const PERMS_COOKIE = "mf_perms";

export function readPermsCookie(): string[] | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)mf_perms=([^;]+)/);
  return m ? decodeURIComponent(m[1]).split(",").filter(Boolean) : null;
}
