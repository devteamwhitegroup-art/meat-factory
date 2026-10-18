// A cost the company paid to complete one sale (fuel, parking, road toll…).
// Doesn't change what the customer owes — net = tx.amount − Σ(expenses).
export type TSalesExpense = {
  id: string;
  salesTransactionId: string;
  name: string;
  amountMnt: number;
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};
