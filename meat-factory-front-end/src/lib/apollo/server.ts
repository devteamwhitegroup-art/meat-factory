import 'server-only';

import { HttpLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from '@apollo/client-integration-nextjs';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

// Per-request RSC client (request-scoped by registerApolloClient).
// Hits the back-end directly and attaches the JWT as `Bearer <token>`.
export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  const authLink = new SetContextLink(async (prevContext) => {
    const jar = await cookies();
    const token = jar.get(env.AUTH_COOKIE_NAME)?.value ?? '';
    return {
      headers: {
        ...(prevContext.headers as Record<string, string> | undefined),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  const httpLink = new HttpLink({
    uri: env.GRAPHQL_UPSTREAM_URL,
    fetchOptions: { cache: 'no-store' },
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(httpLink),
  });
});
