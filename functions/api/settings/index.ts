import type { Env } from '../../../src/types';
import { verifyToken } from '../auth/verify';

interface PagesContext {
  request: Request;
  env: Env;
}

async function hashPassword(password: string): Promise<string> {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${salt}:${hash}`;
}

export async function onRequestGet({ request, env }: PagesContext): Promise<Response> {
  const isAdmin = await verifyToken(request, env);

  const store = await env.DB.prepare(
    'SELECT id, name, logo_url, color_primary, color_secondary, color_accent, stripe_publishable_key, venmo_handle FROM stores WHERE id = ?'
  ).bind('default').first();

  if (isAdmin) {
    // Admin also gets apple_pay_domain_file (not secret key though)
    const adminStore = await env.DB.prepare(
      'SELECT id, name, logo_url, color_primary, color_secondary, color_accent, stripe_publishable_key, venmo_handle, apple_pay_domain_file FROM stores WHERE id = ?'
    ).bind('default').first();
    return new Response(JSON.stringify(adminStore), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(store), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPut({ request, env }: PagesContext): Promise<Response> {
  const isAdmin = await verifyToken(request, env);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json() as Partial<{
    name: string;
    logo_url: string;
    color_primary: string;
    color_secondary: string;
    color_accent: string;
    stripe_publishable_key: string;
    stripe_secret_key: string;
    venmo_handle: string;
    admin_password: string;
    apple_pay_domain_file: string;
  }>;

  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.logo_url !== undefined) { fields.push('logo_url = ?'); values.push(body.logo_url); }
  if (body.color_primary !== undefined) { fields.push('color_primary = ?'); values.push(body.color_primary); }
  if (body.color_secondary !== undefined) { fields.push('color_secondary = ?'); values.push(body.color_secondary); }
  if (body.color_accent !== undefined) { fields.push('color_accent = ?'); values.push(body.color_accent); }
  if (body.stripe_publishable_key !== undefined) { fields.push('stripe_publishable_key = ?'); values.push(body.stripe_publishable_key); }
  if (body.venmo_handle !== undefined) { fields.push('venmo_handle = ?'); values.push(body.venmo_handle); }
  if (body.apple_pay_domain_file !== undefined) { fields.push('apple_pay_domain_file = ?'); values.push(body.apple_pay_domain_file); }

  // Only update secret key if provided and non-empty
  if (body.stripe_secret_key) {
    fields.push('stripe_secret_key = ?');
    values.push(body.stripe_secret_key);
  }

  // Hash new password if provided
  if (body.admin_password) {
    const hashed = await hashPassword(body.admin_password);
    fields.push('admin_password_hash = ?');
    values.push(hashed);
  }

  if (fields.length === 0) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push('default');

  await env.DB.prepare(
    `UPDATE stores SET ${fields.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204 });
}
