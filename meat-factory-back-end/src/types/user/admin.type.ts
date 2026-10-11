// Staff account. Access = the Role's permission set (see role.type.ts);
// `factory` is the site the account is bound to — null for cross-factory
// roles, required for every other role (controller-enforced).
export type TAdmin = {
  id: string;
  param: string;
  password: string;
  roleId: string;
  factory: string | null;
};

export type TCreateAdmin = {
  param: string;
  password: string;
  roleId: string;
  factory?: string | null;
};

export type TUpdateAdmin = {
  id: string;
  param?: string | null;
  password?: string | null;
  roleId?: string | null;
  factory?: string | null;
};

export type TAdminLoginInput = {
  param: string;
  password: string;
};
