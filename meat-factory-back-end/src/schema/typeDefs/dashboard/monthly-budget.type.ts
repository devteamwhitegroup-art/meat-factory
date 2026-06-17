export default `#graphql
    type MonthlyBudget {
        id: ID
        year: Int
        month: Int
        amountMnt: Float
        notes: String
        createdAt: Date
        updatedAt: Date
    }

    type MonthlyBudgetResponse {
        success: Boolean
        message: String
        budget: MonthlyBudget
    }

    type MonthlyBudgetsResponse {
        success: Boolean
        message: String
        budgets: [MonthlyBudget]
    }

    # Single bucket on the dashboard's monthly-overview chart.
    type MonthlyOverviewRow {
        year: Int
        month: Int
        budgetMnt: Float
        herderCostMnt: Float
        incomeMnt: Float
    }

    type MonthlyOverviewResponse {
        success: Boolean
        message: String
        rows: [MonthlyOverviewRow]
    }

    extend type Query {
        monthlyBudgets: MonthlyBudgetsResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
        monthlyOverview(monthsBack: Int): MonthlyOverviewResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }

    extend type Mutation {
        upsertMonthlyBudget(
            year: Int!
            month: Int!
            amountMnt: Float!
            notes: String
        ): MonthlyBudgetResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])

        deleteMonthlyBudget(id: ID!): Response @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }
`;
