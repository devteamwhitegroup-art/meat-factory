import { ADMIN_ROLE } from '../user/admin.type';

// Raw GraphQL context built in index.ts from the Authorization header,
// before the auth directive resolves the bearer token to an admin.
export type TBaseContext = {
  token: string;
};

// Context seen by guarded resolver fields — the auth directive injects the
// authenticated admin's id/role on top of the base context.
export type TContext = {
  id: string;
  role: ADMIN_ROLE;
};

export type TPagination = {
  limit: number;
  page: number;
};

export type TPaginationGeneric<T> = {
  rows: Array<T>;
  count: number;
};
