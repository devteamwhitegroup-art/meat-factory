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

// `group` is the sidebar section heading; sub-page tab lists leave it out.
export type NavItem = { href: string; label: string; group?: string };
type NavEntry = NavItem & { perms: Permission[]; livestock?: boolean };

const G = {
  main: "Үндсэн",
  sales: "Борлуулалт",
  stock: "Агуулах",
  system: "Систем",
};

// Main menu in display order; an item shows when the account holds ANY of
// its permissions. Sub-pages left out stay reachable by link.
const NAV: NavEntry[] = [
  {
    href: "/dashboard",
    label: "Тайлан",
    group: G.main,
    perms: ["DASHBOARD_VIEW"],
  },
  {
    href: "/registrations",
    label: "Бүртгэл",
    group: G.main,
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
    group: G.main,
    perms: ["MEDICAL_NUMBER_CHECK"],
    livestock: true,
  },
  { href: "/sales", label: "Гүйлгээ", group: G.sales, perms: ["SALES_MANAGE"] },
  {
    href: "/byproduct",
    label: "Дайвар",
    group: G.stock,
    perms: ["BYPRODUCT_PROCESS"],
  },
  {
    href: "/inventory",
    label: "Нөөц",
    group: G.stock,
    perms: ["INVENTORY_VIEW"],
  },
  {
    href: "/shipments",
    label: "Ачилт",
    group: G.sales,
    perms: ["SHIPMENT_VIEW"],
  },
  {
    href: "/herders",
    label: "Малчид",
    group: G.main,
    perms: ["HERDER_MANAGE"],
  },
  {
    href: "/customers",
    label: "Харилцагч",
    group: G.sales,
    perms: ["CUSTOMER_MANAGE"],
  },
  {
    href: "/change-requests",
    label: "Засварын хүсэлт",
    group: G.system,
    perms: ["CHANGE_REQUEST_REVIEW"],
  },
  {
    href: "/settings",
    label: "Систем тохиргоо",
    group: G.system,
    perms: ["SETTINGS_MANAGE", "STAFF_MANAGE", "CATALOG_MANAGE"],
  },
];

// Everyone lands on Нүүр (the "what is waiting for me" board), so it heads
// every menu. Staff at a byproduct-kind site never touch livestock: those
// items drop and their own work (Дайвар) comes right after it.
export function navItemsFor(
  perms: readonly string[] | null | undefined,
  factoryKind: string | null | undefined,
): NavItem[] {
  const byproductSite = factoryKind === "BYPRODUCT";
  const items = NAV.filter(
    (n) => can(perms, ...n.perms) && !(byproductSite && n.livestock),
  ).map(({ href, label, group }) => ({ href, label, group }));
  if (byproductSite)
    items.sort((a, b) =>
      a.href === "/byproduct" ? -1 : b.href === "/byproduct" ? 1 : 0,
    );
  return [{ href: "/", label: "Нүүр", group: G.main }, ...items];
}

// The single active nav link: among items whose path matches (exact or
// sub-route) AND whose query params all match the URL, the most specific
// (longest href) wins — so /registrations/new lights only "Шинэ бүртгэл", not
// every /registrations?stage=… link. Shared by the Shell and sub-page tabs.
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
