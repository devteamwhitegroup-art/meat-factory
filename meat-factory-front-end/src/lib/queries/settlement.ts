import { graphql } from "@/lib/gql/gql";

export const SettlementsListDoc = graphql(/* GraphQL */ `
  query Settlements(
    $factory: FACTORY
    $isPaid: Boolean
    $herderId: ID
    $dateRange: DateRangeInput
    $limit: Int
    $page: Int
  ) {
    settlements(
      factory: $factory
      isPaid: $isPaid
      herderId: $herderId
      dateRange: $dateRange
      limit: $limit
      page: $page
    ) {
      success
      message
      count
      settlements {
        id
        registrationId
        registration {
          id
          registrationCode
          herder {
            id
            name
          }
        }
        totalMeatAmount
        totalByproductAmount
        totalSlaughterCost
        grossAmount
        netPayable
        heldAmount
        paidAmount
        isPaid
        paidAt
        createdAt
      }
    }
  }
`);
