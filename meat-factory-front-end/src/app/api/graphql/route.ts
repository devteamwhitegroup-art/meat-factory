import { getSessionToken, proxyUpstream } from '@/lib/api/proxy';
import { env } from '@/lib/env';

// Same-origin GraphQL proxy. The browser Apollo client posts here so the
// JWT cookie never has to leave the server. We re-issue the request to the
// back-end with the token as a `Bearer <token>` Authorization header (the
// back-end strips the prefix before verifying).
export async function POST(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return Response.json(
      { errors: [{ message: 'Not authenticated' }] },
      { status: 401 },
    );
  }

  const body = await request.text();
  return proxyUpstream(env.GRAPHQL_UPSTREAM_URL, {
    method: 'POST',
    headers: {
      'content-type':
        request.headers.get('content-type') ?? 'application/json',
      authorization: `Bearer ${token}`,
    },
    body,
  });
}
