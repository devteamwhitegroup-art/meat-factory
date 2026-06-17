// One partial payment against a SalesTransaction. Total outstanding =
// SalesTransaction.amount − Σ(installments.amountMnt). When outstanding ≤ 0
// the transaction is auto-flipped to PAID (and paidAt to the latest install).
export type TSalesInstallment = {
  id: string;
  salesTransactionId: string;
  amountMnt: number;
  paidAt: Date;
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TAddSalesInstallment = {
  salesTransactionId: string;
  amountMnt: number;
  paidAt?: Date | null;
  notes?: string | null;
};
