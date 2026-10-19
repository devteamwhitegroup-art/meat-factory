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

// A site's priced byproducts: whole гэдэс (LIVE_SLAUGHTER, wrapperId) or
// single items (PRE_BUTCHERED, constantId).
export const FactoryByproductsDoc = graphql(/* GraphQL */ `
  query FactoryByproducts($factory: String!) {
    factoryByproducts(factory: $factory) {
      success
      message
      factoryByproducts {
        id
        wrapperId
        constantId
        name
        animalType
        price
      }
    }
  }
`);

export const SetFactoryByproductDoc = graphql(/* GraphQL */ `
  mutation SetFactoryByproduct(
    $factory: String!
    $wrapperId: ID
    $constantId: ID
    $price: Float!
  ) {
    setFactoryByproduct(
      factory: $factory
      wrapperId: $wrapperId
      constantId: $constantId
      price: $price
    ) {
      success
      message
    }
  }
`);

export const DeleteFactoryByproductDoc = graphql(/* GraphQL */ `
  mutation DeleteFactoryByproduct($id: ID!) {
    deleteFactoryByproduct(id: $id) {
      success
      message
    }
  }
`);
