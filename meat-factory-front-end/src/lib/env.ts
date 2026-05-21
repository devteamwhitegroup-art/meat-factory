// Server-only environment getter. Throws if a required var is missing.
// NEVER import this from a client component.
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export const env = {
  GRAPHQL_UPSTREAM_URL: need('GRAPHQL_UPSTREAM_URL'),
  FILE_UPLOAD_UPSTREAM_URL: need('FILE_UPLOAD_UPSTREAM_URL'),
  AUTH_COOKIE_NAME: need('AUTH_COOKIE_NAME'),
  ROLE_COOKIE_NAME: need('ROLE_COOKIE_NAME'),
  COOKIE_SECURE: (process.env.COOKIE_SECURE ?? 'false').toLowerCase() === 'true',
};
