import { graphql } from "@/lib/gql/gql";

export const DashboardDoc = graphql(/* GraphQL */ `
  query Dashboard($dateRange: DateRangeInput) {
    dashboard(dateRange: $dateRange) {
      success
      message
      dashboard {
        totalMeatIncome
        totalHerderIncome
        pendingPayoutAmount
        activeHerderCount
        transactionCount
        pendingServicesCount
        totalByproductKg
        animalBreakdown {
          animalType
          totalKg
          totalAmount
        }
        byproductBreakdown {
          name
          totalKg
        }
        pipeline {
          registered
          inProcess
          paymentPending
          paid
        }
        recentTransactions {
          id
          transactionCode
          amount
          totalWeightKg
          paymentStatus
          transactionDate
          customer {
            id
            name
          }
        }
        recentShipments {
          id
          shipmentCode
          status
          weightKg
          shippedAt
          createdAt
          customer {
            id
            name
          }
        }
      }
    }
  }
`);
