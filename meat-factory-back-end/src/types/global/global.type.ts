import { ADMIN_ROLE } from '../user/admin.type';

export type TContext = {
  id: string;
  role: ADMIN_ROLE;
};

export type TValidateResponse<
  isCreate extends boolean,
  T
> = isCreate extends true ? T : Partial<T>;

export type TPagination = {
  limit: number;
  page: number;
};

export type TPaginationGeneric<T> = {
  rows: Array<T>;
  count: number;
};

export enum MAIL_TYPE {
  RESET_PASSWORD = 'reset-password'
  // VERIFY_EMAIL = 'verify-email'
}
