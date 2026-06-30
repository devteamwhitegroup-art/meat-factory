import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { z } from "zod";
import { env } from "@/lib/env";

const LOGIN_DOC = /* GraphQL */ `
  mutation LoginAdmin($param: String!, $password: String!) {
    loginAdmin(param: $param, password: $password) {
      success
      message
      token
      admin {
        id
        role
      }
    }
  }
`;

const bodySchema = z.object({
  param: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  let parsed;
  try {
    const json = await request.json();
    parsed = bodySchema.parse(json);
  } catch {
    return Response.json(
      { ok: false, message: "Хүсэлт буруу байна" },
      { status: 400 },
    );
  }

  const upstream = await fetch(env.GRAPHQL_UPSTREAM_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: LOGIN_DOC, variables: parsed }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    return Response.json(
      { ok: false, message: "Серверт хандах боломжгүй байна" },
      { status: 502 },
    );
  }

  const json = (await upstream.json()) as {
    data?: {
      loginAdmin?: {
        success: boolean;
        message: string;
        token: string | null;
        admin: { id: string; role: string } | null;
      };
    };
  };

  const r = json?.data?.loginAdmin;
  if (!r || r.success !== true || !r.token) {
    return Response.json(
      { ok: false, message: r?.message ?? "Нэвтрэх амжилтгүй" },
      { status: 401 },
    );
  }

  // Decode (no verify — back-end re-verifies every request) to read staffRole.
  let staffRole = r.admin?.role ?? "ADMIN";
  try {
    const payload = decodeJwt(r.token) as { staffRole?: string };
    if (payload.staffRole) staffRole = payload.staffRole;
  } catch {
    /* keep fallback */
  }

  const jar = await cookies();
  const week = 60 * 60 * 24 * 7;
  jar.set(env.AUTH_COOKIE_NAME, r.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE,
    path: "/",
    maxAge: week,
  });
  jar.set(env.ROLE_COOKIE_NAME, staffRole, {
    httpOnly: false,
    sameSite: "lax",
    secure: env.COOKIE_SECURE,
    path: "/",
    maxAge: week,
  });

  return Response.json({ ok: true, role: staffRole });
}
