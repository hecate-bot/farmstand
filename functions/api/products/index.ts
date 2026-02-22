import type { Env } from '../../../src/types';
import { verifyToken } from '../auth/verify';

interface PagesContext {
  request: Request;
  env: Env;
}

export async function onRequestGet({ request, env }: PagesContext): Promise<Response> {
  const isAdmin = await verifyToken(request, env);
  const url = new URL(request.url);
  const adminMode = isAdmin && url.searchParams.get('admin') === '1';

  const query = adminMode
    ? 'SELECT * FROM products WHERE store_id = ? ORDER BY sort_order ASC, created_at ASC'
    : 'SELECT * FROM products WHERE store_id = ? AND active = 1 ORDER BY sort_order ASC, created_at ASC';

  const { results } = await env.DB.prepare(query).bind('default').all();

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const isAdmin = await verifyToken(request, env);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json() as {
    name: string;
    description?: string;
    price_cents: number;
    image_url?: string;
    active?: number;
    sort_order?: number;
  };

  if (!body.name || !body.price_cents) {
    return new Response(JSON.stringify({ error: 'name and price_cents are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    `INSERT INTO products (id, store_id, name, description, price_cents, image_url, active, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, 'default',
    body.name,
    body.description || '',
    body.price_cents,
    body.image_url || '',
    body.active ?? 1,
    body.sort_order ?? 0,
    now, now
  ).run();

  const product = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();

  return new Response(JSON.stringify(product), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204 });
}
