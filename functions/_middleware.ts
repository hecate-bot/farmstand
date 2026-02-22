import type { Env } from '../src/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
  next: () => Promise<Response>;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  // Prefer explicit ALLOWED_ORIGIN env var; fall back to the request's own origin
  // so that local wrangler dev always works. In production, ALLOWED_ORIGIN should
  // be set to your Cloudflare Pages URL (e.g. https://farmstand.pages.dev).
  const allowedOrigin = env.ALLOWED_ORIGIN || request.headers.get('Origin') || '*';
  const requestOrigin = request.headers.get('Origin') ?? '';

  // Reject cross-origin requests that don't match when ALLOWED_ORIGIN is set.
  // Same-origin requests (origin host == request host) are always allowed so
  // the app works on both the custom domain and the *.pages.dev preview URL.
  if (env.ALLOWED_ORIGIN && requestOrigin && requestOrigin !== env.ALLOWED_ORIGIN) {
    try {
      const requestHost = new URL(request.url).host;
      const originHost = new URL(requestOrigin).host;
      if (originHost !== requestHost) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const response = await context.next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return newResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
      },
    });
  }
}
