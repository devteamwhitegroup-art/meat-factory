import { graphql } from '@/lib/gql/gql';

export const MonthlyBudgetsDoc = graphql(/* GraphQL */ `
  query MonthlyBudgets {
    monthlyBudgets {
      success
      message
      budgets {
        id
        year
        month
        amountMnt
        notes
        updatedAt
      }
    }
  }
`);

export const MonthlyOverviewDoc = graphql(/* GraphQL */ `
  query MonthlyOverview($monthsBack: Int) {
    monthlyOverview(monthsBack: $monthsBack) {
      success
      message
      rows {
        year
        month
        budgetMnt
        herderCostMnt
        incomeMnt
      }
    }
  }
`);

export const UpsertMonthlyBudgetDoc = graphql(/* GraphQL */ `
  mutation UpsertMonthlyBudget(
    $year: Int!
    $month: Int!
    $amountMnt: Float!
    $notes: String
  ) {
    upsertMonthlyBudget(
      year: $year
      month: $month
      amountMnt: $amountMnt
      notes: $notes
    ) {
      success
      message
      budget { id year month amountMnt }
    }
  }
`);

export const DeleteMonthlyBudgetDoc = graphql(/* GraphQL */ `
  mutation DeleteMonthlyBudget($id: ID!) {
    deleteMonthlyBudget(id: $id) { success message }
  }
`);
