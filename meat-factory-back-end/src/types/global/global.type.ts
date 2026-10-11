import { PERMISSION } from '../user/permission.type';

// Raw GraphQL context built in index.ts from the Authorization header,
// before the auth directive resolves the bearer token to an admin.
export type TBaseContext = {
  token: string;
  // Shared secret from the X-Print-Relay-Token header — used only by the
  // print relay's claimNextPrintJob / ackPrintJob calls (no JWT).
  relayToken: string;
};

// Context seen by guarded resolver fields — the auth directive injects the
// authenticated admin's id, their role's permissions and factory binding on
// top of the base context (all read live from the DB, never from the JWT).
export type TContext = {
  id: string;
  permissions: readonly PERMISSION[];
  // Role spans every factory (then `factory` is null).
  crossFactory: boolean;
  factory: string | null;
};

export type TPagination = {
  limit: number;
  page: number;
};

// GraphQL DateRangeInput — optional bounds shared by every date-filtered list.
export type TDateRange = {
  startDate?: Date | null;
  endDate?: Date | null;
};

export type TPaginationGeneric<T> = {
  rows: Array<T>;
  count: number;
};
