import type { Env } from '../../../src/types';

interface PagesContext {
  request: Request;
  env: Env;
}

// Hash password with SHA-256 + salt using Web Crypto API
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const computed = await hashPassword(password, salt);
  return computed === hash;
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const json = await request.json().catch(() => ({})) as { password?: string };
  const { password } = json;

  if (!password) {
    return new Response(JSON.stringify({ error: 'Password required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const store = await env.DB.prepare(
    'SELECT admin_password_hash FROM stores WHERE id = ?'
  ).bind('default').first<{ admin_password_hash: string }>();

  const valid = await verifyPassword(password, store?.admin_password_hash || '');

  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create session token
  const token = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days

  await env.DB.prepare(
    'INSERT INTO sessions (token, expires_at) VALUES (?, ?)'
  ).bind(token, expiresAt).run();

  return new Response(JSON.stringify({ token }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// OPTIONS for CORS
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204 });
}
