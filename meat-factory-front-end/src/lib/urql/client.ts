'use client';

import { createClient } from '@urql/core';
import { exchanges } from './exchanges';

// Browser-side urql client. Always hits the same-origin Next proxy at
// /api/graphql, which injects the JWT cookie as the bare Authorization
// header server-side. The token NEVER reaches client JS.
export const browserUrqlClient = createClient({
  url: '/api/graphql',
  exchanges,
  fetchOptions: { credentials: 'include' },
});
