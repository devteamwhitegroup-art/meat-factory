"use client";

import { HttpLink } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";

// Browser Apollo client. Talks to the same-origin Next proxy at
// /api/graphql, which injects the JWT cookie as the bare Authorization
// header server-side — the token never reaches client JS.
export function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: "/api/graphql",
      credentials: "include",
    }),
  });
}
