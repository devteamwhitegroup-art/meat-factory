// Баталгаажуулалт — two distinct staff must sign off.
export type TVerification = {
  id: string;
  registrationId: string;
  firstVerifierId: string | null;
  firstVerifiedAt: Date | null;
  secondVerifierId: string | null;
  secondVerifiedAt: Date | null;
  notes: string | null;
  photoFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TVerifyInput = {
  registrationId: string;
  notes?: string | null;
  photoFileId?: string | null;
};
