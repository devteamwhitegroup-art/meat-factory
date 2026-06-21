import { MonthlyBudgetController } from '../../../controller/dashboard/monthly-budget.controller';
import { TUpsertMonthlyBudget } from '../../../types/dashboard/monthly-budget.type';
import { wrapItems, wrapOne, wrapVoid } from '../../../utils';

export default {
  Query: {
    monthlyBudgets: wrapItems('budgets', () => MonthlyBudgetController.list()),
    monthlyOverview: wrapItems(
      'rows',
      ({ monthsBack }: { monthsBack?: number }) =>
        MonthlyBudgetController.overview(monthsBack ?? 12)
    )
  },
  Mutation: {
    upsertMonthlyBudget: wrapOne(
      'budget',
      (doc: TUpsertMonthlyBudget) => MonthlyBudgetController.upsert(doc),
      'Хадгалагдлаа'
    ),
    deleteMonthlyBudget: wrapVoid('Устгагдлаа', ({ id }: { id: string }) =>
      MonthlyBudgetController.remove(id)
    )
  }
};
