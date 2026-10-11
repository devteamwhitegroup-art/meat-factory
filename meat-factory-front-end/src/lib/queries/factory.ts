import { graphql } from "@/lib/gql/gql";

// Admin-managed sites. `code` is what every `factory` field carries; the
// `kind` drives which intake/weigh/verify flow a record follows.
export const FactoriesDoc = graphql(/* GraphQL */ `
  query Factories($includeInactive: Boolean) {
    factories(includeInactive: $includeInactive) {
      success
      message
      factories {
        code
        name
        kind
        isActive
      }
    }
  }
`);

export const CreateFactoryDoc = graphql(/* GraphQL */ `
  mutation CreateFactory($code: String!, $name: String!, $kind: FACTORY_KIND!) {
    createFactory(code: $code, name: $name, kind: $kind) {
      success
      message
    }
  }
`);

export const UpdateFactoryDoc = graphql(/* GraphQL */ `
  mutation UpdateFactory($code: String!, $name: String, $isActive: Boolean) {
    updateFactory(code: $code, name: $name, isActive: $isActive) {
      success
      message
    }
  }
`);
