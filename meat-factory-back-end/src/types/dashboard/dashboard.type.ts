export type TDateRange = {
  startDate?: Date | null;
  endDate?: Date | null;
};

export type TAnimalBreakdownItem = {
  animalType: string;
  totalKg: number;
  totalAmount: number;
};

export type TByproductBreakdownItem = {
  // Free-form Mongolian name (e.g. "Адууны хэл"). The pre-refactor enum
  // (HEART/LIVER/…) is no longer how byproducts are keyed.
  name: string;
  totalKg: number;
};

// Counts that mirror the FE /registrations stage chips.
export type TPipelineCounts = {
  registered: number; // REGISTERED
  inProcess: number; // WEIGHED + VERIFIED
  paymentPending: number; // PAYMENT_PENDING
  paid: number; // SETTLED
};

export type TDashboard = {
  totalMeatIncome: number; // НИЙТ МАХНЫ ОРЛОГО (sales income)
  totalHerderIncome: number; // МАЛЧДЫН ОРЛОГО (paid settlements)
  pendingPayoutAmount: number; // ХҮЛЭЭГДЭЖ БУЙ ТӨЛБӨР (sum of unpaid settlements)
  activeHerderCount: number; // ИДЭВХТЭЙ МАЛЧДЫН ТОО (excluding CANCELLED)
  transactionCount: number; // ГҮЙЛГЭЭНИЙ ТОО
  pendingServicesCount: number; // ХҮЛЭЭГДЭЖ БУЙ ГҮЙЛГЭЭ (sales-side AR)
  totalByproductKg: number; // ДАЙВАР (handoff weight, not sales)
  animalBreakdown: TAnimalBreakdownItem[];
  byproductBreakdown: TByproductBreakdownItem[]; // top byproducts by handoff kg
  pipeline: TPipelineCounts;
  recentTransactions: unknown[];
  recentShipments: unknown[];
};

export type TGetDashboard = {
  dateRange?: TDateRange;
};
