interface Env {
  CONTACT_SCRIPT_URL: string;
}

interface ContactPayload {
  name?: string;
  email?: string;
  message?: string;
  company?: string; // honeypot — real visitors never see or fill this field
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = { name: 100, email: 200, message: 4000 };

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Bots fill every field on a form, including ones hidden from real visitors
  // via CSS. Silently pretend success so the bot doesn't retry/adapt.
  if (body.company) {
    return Response.json({ ok: true });
  }

  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim();
  const message = (body.message ?? '').trim();

  if (!name || !email || !message) {
    return Response.json({ error: 'Name, email, and message are required.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (name.length > MAX_LEN.name || email.length > MAX_LEN.email || message.length > MAX_LEN.message) {
    return Response.json({ error: 'One of the fields is too long.' }, { status: 400 });
  }

  if (!env.CONTACT_SCRIPT_URL) {
    return Response.json({ error: 'Contact form is not configured yet.' }, { status: 500 });
  }

  let scriptRes: Response;
  try {
    scriptRes = await fetch(env.CONTACT_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    });
  } catch {
    return Response.json({ error: 'Could not send your message. Please try again.' }, { status: 502 });
  }

  if (!scriptRes.ok) {
    return Response.json({ error: 'Could not send your message. Please try again.' }, { status: 502 });
  }

  // Apps Script web apps always answer HTTP 200, even when the script's own
  // try/catch caught an internal error — so scriptRes.ok alone can't tell us
  // whether the emails actually sent. Check the JSON body it returns too.
  let scriptBody: { ok?: boolean; error?: string };
  try {
    scriptBody = await scriptRes.json();
  } catch {
    return Response.json({ error: 'Could not send your message. Please try again.' }, { status: 502 });
  }

  if (!scriptBody.ok) {
    return Response.json({ error: 'Could not send your message. Please try again.' }, { status: 502 });
  }

  return Response.json({ ok: true });
};
