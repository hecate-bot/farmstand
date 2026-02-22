import type { Env } from '../../../src/types';

interface PagesContext {
  request: Request;
  env: Env;
}

export async function verifyToken(request: Request, env: Env): Promise<boolean> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return false;

  const token = auth.slice(7);
  const now = Math.floor(Date.now() / 1000);

  const session = await env.DB.prepare(
    'SELECT token FROM sessions WHERE token = ? AND expires_at > ?'
  ).bind(token, now).first<{ token: string }>();

  return !!session;
}

export async function onRequestGet({ request, env }: PagesContext): Promise<Response> {
  const valid = await verifyToken(request, env);
  return new Response(JSON.stringify({ valid }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
