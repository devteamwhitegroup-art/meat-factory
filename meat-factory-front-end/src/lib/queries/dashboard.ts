import { graphql } from '@/lib/gql/gql';

export const DashboardDoc = graphql(/* GraphQL */ `
  query Dashboard($dateRange: DateRangeInput) {
    dashboard(dateRange: $dateRange) {
      success
      message
      dashboard {
        totalMeatIncome
        totalHerderIncome
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
          byproductType
          totalKg
          totalAmount
        }
        recentTransactions {
          id
          transactionCode
          amount
          totalWeightKg
          paymentStatus
          transactionDate
          customer { id name }
        }
        recentShipments {
          id
          shipmentCode
          status
          weightKg
          shippedAt
          createdAt
          customer { id name }
        }
      }
    }
  }
`);
