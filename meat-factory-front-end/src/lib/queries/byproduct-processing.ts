import { graphql } from "@/lib/gql/gql";

// Byproduct factory (FACTORY_3): F1/F2 send counted гэдэс here, batches are
// disassembled and each organ weighed — expected (norm) vs actual kg.
export const ByproductProcessingsDoc = graphql(/* GraphQL */ `
  query ByproductProcessings(
    $factory: FACTORY
    $wrapperId: ID
    $dateRange: DateRangeInput
    $limit: Int
    $page: Int
  ) {
    byproductProcessings(
      factory: $factory
      wrapperId: $wrapperId
      dateRange: $dateRange
      limit: $limit
      page: $page
    ) {
      success
      message
      count
      processings {
        id
        code
        factory
        bundleCount
        notes
        createdAt
        createdBy {
          id
          param
        }
        wrapper {
          id
          name
          animalType
        }
        lines {
          id
          name
          expectedCount
          expectedKg
          actualKg
        }
      }
    }
  }
`);

export const ByproductProcessingSummaryDoc = graphql(/* GraphQL */ `
  query ByproductProcessingSummary(
    $factory: FACTORY
    $dateRange: DateRangeInput
  ) {
    byproductProcessingSummary(factory: $factory, dateRange: $dateRange) {
      success
      message
      items {
        animalType
        wrapperName
        name
        bundleCount
        expectedKg
        actualKg
        diffKg
        diffPercent
      }
    }
  }
`);

export const CreateByproductProcessingDoc = graphql(/* GraphQL */ `
  mutation CreateByproductProcessing(
    $factory: FACTORY
    $wrapperId: ID!
    $bundleCount: Int!
    $lines: [ByproductProcessingLineInput!]!
    $notes: String
  ) {
    createByproductProcessing(
      factory: $factory
      wrapperId: $wrapperId
      bundleCount: $bundleCount
      lines: $lines
      notes: $notes
    ) {
      success
      message
      processing {
        id
        code
      }
    }
  }
`);

export const TransferByproductsDoc = graphql(/* GraphQL */ `
  mutation TransferByproducts(
    $fromFactory: FACTORY
    $lines: [ByproductTransferLineInput!]!
    $notes: String
  ) {
    transferByproducts(fromFactory: $fromFactory, lines: $lines, notes: $notes) {
      success
      message
    }
  }
`);
