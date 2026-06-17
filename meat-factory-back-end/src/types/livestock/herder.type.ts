import { TPagination } from '../global/global.type';

export type THerder = {
  id: string;
  name: string; // Малчны нэр
  registrationNo: string; // Регистрийн дугаар
  phone: string | null; // Утасны дугаар
  bankAccount: string | null; // Дансны дугаар
  bankName: string | null; // Банкны нэр (e.g. "Хаан банк")
  accountHolderName: string | null; // Эзэмшигчийн нэр (when != herder.name)
  // FK into the admin-curated HerderAddresses catalogue. Preferred path.
  addressId: string | null;
  // Legacy free-form address — nullable for back-compat / ad-hoc cases.
  // The GraphQL `Herder.address: String` field resolver returns
  // `addressEntry?.name ?? address` so existing FE callers keep working.
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateHerder = {
  name: string;
  registrationNo: string;
  phone?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  accountHolderName?: string | null;
  addressId?: string | null;
  // Free-form fallback. At least one of addressId / address must be set.
  address?: string | null;
};

export type TUpdateHerder = Partial<TCreateHerder> & { id: string };

export type TListHerders = { search?: string } & TPagination;
