export enum ADMIN_ROLE {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  // Meat-factory operational roles
  MANAGER = 'MANAGER',
  GUARD = 'GUARD',
  SCALE = 'SCALE',
  STOREKEEPER = 'STOREKEEPER'
}

export type TCreateAdmin = {
  param: string;
  password: string;
  role?: ADMIN_ROLE;
};

export type TAdmin = {
  id: string;
  param: string;
  password: string;
  role: ADMIN_ROLE;
};

export type TAdminLoginInput = {
  param: string;
  password: string;
};
