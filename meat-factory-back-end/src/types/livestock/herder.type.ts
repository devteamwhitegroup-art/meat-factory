import { TPagination } from '../global/global.type';

export type THerder = {
  id: string;
  name: string; // Малчны нэр
  registrationNo: string; // Регистрийн дугаар
  phone: string | null; // Утасны дугаар
  bankAccount: string | null; // Малчны данс
  address: string; // Хаяг
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateHerder = {
  name: string;
  registrationNo: string;
  phone?: string | null;
  bankAccount?: string | null;
  address: string;
};

export type TUpdateHerder = Partial<TCreateHerder> & { id: string };

export type TListHerders = { search?: string } & TPagination;
