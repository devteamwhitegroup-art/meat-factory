// Баталгаажуулалт — single-signer (нярав / нягтлан / админ).
export type TVerification = {
  id: string;
  registrationId: string;
  firstVerifierId: string | null;
  firstVerifiedAt: Date | null;
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
