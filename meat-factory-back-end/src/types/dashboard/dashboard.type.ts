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
  byproductType: string;
  totalKg: number;
  totalAmount: number;
};

export type TDashboard = {
  totalMeatIncome: number; // НИЙТ МАХНЫ ОРЛОГО
  totalHerderIncome: number; // МАЛЧДЫН ОРЛОГО
  activeHerderCount: number; // ИДЭВХТЭЙ МАЛЧДЫН ТОО
  transactionCount: number; // ГҮЙЛГЭЭНИЙ ТОО
  pendingServicesCount: number; // ТӨЛБӨР ХҮЛЭЭГДЭЖ БУЙ
  totalByproductKg: number; // ДАЙВАР
  animalBreakdown: TAnimalBreakdownItem[]; // Малын задаргаа
  byproductBreakdown: TByproductBreakdownItem[]; // Дайвар задаргаа
  recentTransactions: unknown[]; // Сүүлийн гүйлгээ
  recentShipments: unknown[]; // Ачилт
};

export type TGetDashboard = {
  dateRange?: TDateRange;
};
