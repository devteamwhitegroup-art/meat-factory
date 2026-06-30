import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Read the session JWT from the httpOnly cookie. Server-only.
export async function getSessionToken(): Promise<string> {
  const jar = await cookies();
  return jar.get(env.AUTH_COOKIE_NAME)?.value ?? "";
}

// Forward a request to the back-end and relay its body + content-type. A
// network failure (back-end unreachable) becomes a clean 502 JSON response
// instead of an unhandled 500. `errorBody` shapes that 502 for the caller —
// Apollo expects `{ errors: [...] }`; REST-style callers expect `{ success }`.
export async function proxyUpstream(
  url: string,
  init: RequestInit,
  errorBody: unknown = {
    errors: [{ message: "Серверт хандах боломжгүй байна" }],
  },
): Promise<Response> {
  let upstream: Response;
  try {
    upstream = await fetch(url, { cache: "no-store", ...init });
  } catch {
    return Response.json(errorBody, { status: 502 });
  }

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
