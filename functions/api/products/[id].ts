import type { Env } from '../../../src/types';
import { verifyToken } from '../auth/verify';

interface PagesContext {
  request: Request;
  env: Env;
  params: { id: string };
}

export async function onRequestGet({ env, params }: PagesContext): Promise<Response> {
  const product = await env.DB.prepare(
    'SELECT * FROM products WHERE id = ? AND store_id = ?'
  ).bind(params.id, 'default').first();

  if (!product) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(product), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPut({ request, env, params }: PagesContext): Promise<Response> {
  const isAdmin = await verifyToken(request, env);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json() as Partial<{
    name: string;
    description: string;
    price_cents: number;
    image_url: string;
    active: number;
    sort_order: number;
  }>;

  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
  if (body.price_cents !== undefined) { fields.push('price_cents = ?'); values.push(body.price_cents); }
  if (body.image_url !== undefined) { fields.push('image_url = ?'); values.push(body.image_url); }
  if (body.active !== undefined) { fields.push('active = ?'); values.push(body.active); }
  if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order); }

  if (fields.length === 0) {
    return new Response(JSON.stringify({ error: 'No fields to update' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(params.id);
  values.push('default');

  await env.DB.prepare(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ? AND store_id = ?`
  ).bind(...values).run();

  const product = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(params.id).first();

  return new Response(JSON.stringify(product), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestDelete({ request, env, params }: PagesContext): Promise<Response> {
  const isAdmin = await verifyToken(request, env);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await env.DB.prepare(
    'DELETE FROM products WHERE id = ? AND store_id = ?'
  ).bind(params.id, 'default').run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204 });
}
