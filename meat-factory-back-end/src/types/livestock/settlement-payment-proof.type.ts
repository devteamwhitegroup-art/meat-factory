// Money-flow statement image attached to a settlement AFTER the payout (bank
// transfer screenshot / receipt). Multiple per settlement, ordered by
// sequenceNo. File data lives in FileModel; this row is the join + ordering.
export type TSettlementPaymentProof = {
  id: string;
  settlementId: string;
  fileId: string;
  sequenceNo: number;
  // Optional label, e.g. "Эхний төлбөр" / "Үлдэгдэл".
  note: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};
