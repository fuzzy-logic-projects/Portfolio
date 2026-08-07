interface Env {
  PORTFOLIO_BUCKET: R2Bucket;
}

// Public, unauthenticated by design: it serves the same files that are already
// publicly reachable via PUBLIC_BUCKET_URL. This just makes them fetchable
// same-origin, so the browser's fetch()/arrayBuffer() (used by the in-site docx
// reader) isn't blocked by cross-origin restrictions the R2 dev URL doesn't set.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const key = new URL(request.url).searchParams.get('key');
  if (!key) {
    return Response.json({ error: 'Missing key.' }, { status: 400 });
  }

  const object = await env.PORTFOLIO_BUCKET.get(key);
  if (!object) {
    return Response.json({ error: 'File not found.' }, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
};
