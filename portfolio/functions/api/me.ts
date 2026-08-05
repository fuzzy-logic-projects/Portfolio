import { parseCookies, verifySessionToken } from '../_lib/auth';

interface Env {
  SESSION_SECRET: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const authenticated = await verifySessionToken(cookies.session, env.SESSION_SECRET);
  return Response.json({ authenticated });
};
