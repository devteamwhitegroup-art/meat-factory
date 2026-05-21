import { cookies } from 'next/headers';
import { env } from '@/lib/env';

// Same-origin GraphQL proxy. The browser Apollo client posts here so the
// JWT cookie never has to leave the server. We re-issue the request to
// the back-end with the token as a `Bearer <token>` Authorization header
// (the back-end strips the prefix before verifying).
export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(env.AUTH_COOKIE_NAME)?.value ?? '';

  if (!token) {
    return Response.json(
      { errors: [{ message: 'Not authenticated' }] },
      { status: 401 },
    );
  }

  const body = await request.text();
  const upstream = await fetch(env.GRAPHQL_UPSTREAM_URL, {
    method: 'POST',
    headers: {
      'content-type':
        request.headers.get('content-type') ?? 'application/json',
      authorization: `Bearer ${token}`,
    },
    body,
    cache: 'no-store',
  });

  const responseBody = await upstream.text();
  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      'content-type':
        upstream.headers.get('content-type') ?? 'application/json',
    },
  });
}
