import "server-only";

import { ApolloLink, HttpLink } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { RetryLink } from "@apollo/client/link/retry";
import { getMainDefinition } from "@apollo/client/utilities";
import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from "@apollo/client-integration-nextjs";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Per-request RSC client (request-scoped by registerApolloClient).
// Hits the back-end directly and attaches the JWT as `Bearer <token>`.
export const { getClient } = registerApolloClient(() => {
  const authLink = new SetContextLink(async (prevContext) => {
    const jar = await cookies();
    const token = jar.get(env.AUTH_COOKIE_NAME)?.value ?? "";
    return {
      headers: {
        ...(prevContext.headers as Record<string, string> | undefined),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  const httpLink = new HttpLink({
    uri: env.GRAPHQL_UPSTREAM_URL,
    fetchOptions: { cache: "no-store" },
  });

  // The back-end is a separate dev process; an idle keep-alive socket it has
  // closed can surface as a transient `ECONNRESET` on the next request, 500-ing
  // the page. Retry such network failures with backoff — but ONLY for queries:
  // a reset on a mutation's response is ambiguous (the write may have already
  // landed), so retrying could double-apply it.
  const retryLink = new RetryLink({
    delay: { initial: 150, max: 1500, jitter: true },
    attempts: {
      max: 3,
      retryIf: (error, operation) => {
        if (!error) return false;
        const def = getMainDefinition(operation.query);
        return def.kind === "OperationDefinition" && def.operation === "query";
      },
    },
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([retryLink, authLink, httpLink]),
  });
});
