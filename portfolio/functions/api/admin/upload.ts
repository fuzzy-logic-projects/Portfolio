import { parseCookies, verifySessionToken } from '../../_lib/auth';

interface Env {
  PORTFOLIO_BUCKET: R2Bucket;
  SESSION_SECRET: string;
  PUBLIC_BUCKET_URL: string;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB — well within R2's free tier

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const cookies = parseCookies(request.headers.get('Cookie'));
  if (!(await verifySessionToken(cookies.session, env.SESSION_SECRET))) {
    return Response.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  if (!env.PUBLIC_BUCKET_URL) {
    return Response.json(
      { error: 'PUBLIC_BUCKET_URL is not configured yet. See the README for setup.' },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid upload.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'No file provided.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: 'File is larger than 25MB.' }, { status: 413 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const key = `uploads/${Date.now()}-${safeName}`;

  await env.PORTFOLIO_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });

  const url = `${env.PUBLIC_BUCKET_URL.replace(/\/$/, '')}/${key}`;
  return Response.json({ url });
};
