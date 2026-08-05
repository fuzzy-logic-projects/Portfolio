import { parseCookies, verifySessionToken } from '../../_lib/auth';

interface Env {
  PORTFOLIO_KV: KVNamespace;
  SESSION_SECRET: string;
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const cookies = parseCookies(request.headers.get('Cookie'));
  if (!(await verifySessionToken(cookies.session, env.SESSION_SECRET))) {
    return Response.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  await env.PORTFOLIO_KV.put('content:categories', JSON.stringify(body));
  return Response.json({ ok: true });
};
