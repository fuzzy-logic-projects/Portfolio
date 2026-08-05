import { createSessionToken, sessionCookieHeader, verifyPassword } from '../_lib/auth';

interface Env {
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  SESSION_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return Response.json({ error: 'Username and password are required.' }, { status: 400 });
  }

  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET) {
    return Response.json(
      { error: 'Admin credentials are not configured yet. See the README for setup.' },
      { status: 500 },
    );
  }

  const usernameOk = username === env.ADMIN_USERNAME;
  const passwordOk = await verifyPassword(password, env.ADMIN_PASSWORD_HASH);

  if (!usernameOk || !passwordOk) {
    return Response.json({ error: 'Incorrect username or password.' }, { status: 401 });
  }

  const token = await createSessionToken(env.SESSION_SECRET);

  return Response.json(
    { ok: true },
    { status: 200, headers: { 'Set-Cookie': sessionCookieHeader(token) } },
  );
};
