import { CLEAR_SESSION_COOKIE } from '../_lib/auth';

export const onRequestPost: PagesFunction = async () => {
  return Response.json({ ok: true }, { status: 200, headers: { 'Set-Cookie': CLEAR_SESSION_COOKIE } });
};
