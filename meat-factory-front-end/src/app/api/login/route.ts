import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";
import { FACTORY_COOKIE, NAME_COOKIE, PERMS_COOKIE } from "@/lib/auth/server";

const LOGIN_DOC = /* GraphQL */ `
  mutation LoginAdmin($param: String!, $password: String!) {
    loginAdmin(param: $param, password: $password) {
      success
      message
      token
      admin {
        id
        param
        factory
        role {
          name
          permissions
          crossFactory
        }
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
        admin: {
          id: string;
          param: string;
          factory: string | null;
          role: {
            name: string;
            permissions: string[];
            crossFactory: boolean;
          } | null;
        } | null;
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

  const jar = await cookies();
  const week = 60 * 60 * 24 * 7;
  const base = {
    sameSite: "lax" as const,
    secure: env.COOKIE_SECURE,
    path: "/",
    maxAge: week,
  };
  jar.set(env.AUTH_COOKIE_NAME, r.token, { ...base, httpOnly: true });
  // UX gating only (the back-end re-checks every request): the role's
  // permission keys + its display name, readable by client components.
  jar.set(PERMS_COOKIE, (r.admin?.role?.permissions ?? []).join(","), {
    ...base,
    httpOnly: false,
  });
  jar.set(env.ROLE_COOKIE_NAME, r.admin?.role?.name ?? "", {
    ...base,
    httpOnly: false,
  });
  // Staff's site; absent for cross-factory roles (they span every factory).
  if (r.admin?.factory)
    jar.set(FACTORY_COOKIE, r.admin.factory, { ...base, httpOnly: false });
  else jar.delete(FACTORY_COOKIE);
  // Display only — read server-side by AppShell.
  jar.set(NAME_COOKIE, r.admin?.param ?? parsed.param, {
    ...base,
    httpOnly: true,
  });

  return Response.json({ ok: true });
}
