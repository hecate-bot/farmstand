import type { Env } from '../../../src/types';

interface PagesContext {
  request: Request;
  env: Env;
}

interface Product {
  id: string;
  price_cents: number;
  name: string;
  active: number;
}

async function stripeRequest(secretKey: string, path: string, body: Record<string, string>): Promise<unknown> {
  const formBody = Object.entries(body)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message || 'Stripe API error');
  }

  return res.json();
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const body = await request.json() as {
    items?: { productId: string; quantity: number }[];
  };

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return new Response(JSON.stringify({ error: 'items array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Load store settings for Stripe secret key
  const store = await env.DB.prepare(
    'SELECT stripe_secret_key, name FROM stores WHERE id = ?'
  ).bind('default').first<{ stripe_secret_key: string; name: string }>();

  if (!store?.stripe_secret_key) {
    return new Response(JSON.stringify({ error: 'Payment not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch product prices from DB — never trust client
  const productIds = body.items.map((i) => i.productId);
  const placeholders = productIds.map(() => '?').join(', ');
  const { results: products } = await env.DB.prepare(
    `SELECT id, price_cents, name, active FROM products WHERE id IN (${placeholders}) AND store_id = ? AND active = 1`
  ).bind(...productIds, 'default').all<Product>();

  if (products.length !== body.items.length) {
    return new Response(JSON.stringify({ error: 'One or more products not found or unavailable' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Calculate total server-side
  const productMap = new Map(products.map((p) => [p.id, p]));
  let totalCents = 0;

  for (const item of body.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return new Response(JSON.stringify({ error: `Product ${item.productId} not found` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (item.quantity < 1 || item.quantity > 99) {
      return new Response(JSON.stringify({ error: 'Invalid quantity' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    totalCents += product.price_cents * item.quantity;
  }

  if (totalCents < 50) { // Stripe minimum is $0.50
    return new Response(JSON.stringify({ error: 'Order total too low' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create Stripe Payment Intent
  const intent = await stripeRequest(store.stripe_secret_key, '/payment_intents', {
    amount: String(totalCents),
    currency: 'usd',
    automatic_payment_methods: 'enabled',
    description: `${store.name} farm stand order`,
  }) as { client_secret: string };

  return new Response(JSON.stringify({ clientSecret: intent.client_secret }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204 });
}
