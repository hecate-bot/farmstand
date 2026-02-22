import type { Env } from '../../../src/types';

interface PagesContext {
  request: Request;
  env: Env;
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204 });
}
