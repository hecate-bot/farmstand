import type { Env } from '../../../src/types';

interface PagesContext {
  request: Request;
  env: Env;
}

const RATE_LIMIT_WINDOW_SECS = 15 * 60; // 15 minutes
const RATE_LIMIT_MAX = 10;

async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const windowStart = Math.floor(Date.now() / 1000) - RATE_LIMIT_WINDOW_SECS;
  const row = await env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM login_attempts WHERE ip = ? AND attempted_at > ?'
  ).bind(ip, windowStart).first<{ cnt: number }>();
  return (row?.cnt ?? 0) < RATE_LIMIT_MAX;
}

async function recordAttempt(ip: string, env: Env): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    'INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)'
  ).bind(ip, now).run();

  // Prune old records (best-effort, non-blocking)
  const cutoff = now - RATE_LIMIT_WINDOW_SECS * 2;
  env.DB.prepare('DELETE FROM login_attempts WHERE attempted_at < ?').bind(cutoff).run();
}

// PBKDF2 password hashing using the Web Crypto API (available in CF Workers)
async function deriveKey(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const computed = await deriveKey(password, salt);
  // Constant-time comparison to prevent timing attacks
  if (computed.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';

  const allowed = await checkRateLimit(ip, env);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Too many login attempts. Try again later.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(RATE_LIMIT_WINDOW_SECS) },
    });
  }

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

  // First-run setup mode: if no password has ever been set, the first login
  // attempt sets the password (minimum 8 characters required).
  if (!store?.admin_password_hash) {
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'First-run setup: choose a password of at least 8 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0')).join('');
    const hashed = `${salt}:${await deriveKey(password, salt)}`;
    await env.DB.prepare(
      'UPDATE stores SET admin_password_hash = ? WHERE id = ?'
    ).bind(hashed, 'default').run();
    // Fall through to issue a session below
  } else {
    const valid = await verifyPassword(password, store.admin_password_hash);

    // Always record the attempt (whether success or failure) to prevent enumeration
    await recordAttempt(ip, env);

    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const token = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 60 * 60 * 24 * 7; // 7 days

  await env.DB.prepare(
    'INSERT INTO sessions (token, created_at, expires_at) VALUES (?, ?, ?)'
  ).bind(token, now, expiresAt).run();

  return new Response(JSON.stringify({ token }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// OPTIONS for CORS
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204 });
}
