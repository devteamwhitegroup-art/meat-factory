// Баталгаажуулалт — single-signer (нярав / нягтлан / админ).
export type TVerification = {
  id: string;
  registrationId: string;
  firstVerifierId: string | null;
  firstVerifiedAt: Date | null;
  notes: string | null;
  photoFileId: string | null;
  // Verifier may decide the slaughter cost is offset by coverable byproducts
  // (e.g. адууны өлөн гэдэс). When true the settlement pre-fills slaughter = 0.
  slaughterCoveredByByproduct: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TVerifyInput = {
  registrationId: string;
  notes?: string | null;
  photoFileId?: string | null;
};
