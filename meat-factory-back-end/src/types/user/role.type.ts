import { PERMISSION } from "./permission.type";

// Admin-managed role: a name + a set of permissions. `crossFactory` roles
// span every factory (their admins carry no factory); the rest are bound to
// one. `isSystem` marks the seeded owner role: undeletable and always holding
// every permission, so admin can never lock themselves out.
export type TRole = {
  id: string;
  name: string;
  permissions: PERMISSION[];
  crossFactory: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateRole = {
  name: string;
  permissions: PERMISSION[];
  crossFactory?: boolean | null;
};

export type TUpdateRole = {
  id: string;
  name?: string | null;
  permissions?: PERMISSION[] | null;
  crossFactory?: boolean | null;
};
