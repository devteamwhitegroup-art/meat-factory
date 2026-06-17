// Monthly budget target — used by the dashboard's monthly overview chart
// (budget vs herder cost vs income). Unique on (year, month).
export type TMonthlyBudget = {
  id: string;
  year: number;
  month: number; // 1..12
  amountMnt: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TUpsertMonthlyBudget = {
  year: number;
  month: number;
  amountMnt: number;
  notes?: string | null;
};

export type TMonthlyOverviewRow = {
  year: number;
  month: number;
  budgetMnt: number;
  herderCostMnt: number;
  incomeMnt: number;
};
