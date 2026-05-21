import 'server-only';

import { createClient } from '@urql/core';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { env } from '@/lib/env';
import { exchanges } from './exchanges';

// One urql client per request (React's `cache()` dedupes within a render).
// Reads the JWT cookie and attaches it as the bare Authorization header.
export const getServerUrqlClient = cache(async () => {
  const jar = await cookies();
  const token = jar.get(env.AUTH_COOKIE_NAME)?.value ?? '';
  return createClient({
    url: env.GRAPHQL_UPSTREAM_URL,
    exchanges,
    fetchOptions: () => {
      const headers: Record<string, string> = {};
      if (token) headers.authorization = token;
      return { headers };
    },
  });
});
