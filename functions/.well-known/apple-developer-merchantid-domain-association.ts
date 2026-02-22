import type { Env } from '../../src/types';

interface PagesContext {
  request: Request;
  env: Env;
}

export async function onRequestGet({ env }: PagesContext): Promise<Response> {
  const store = await env.DB.prepare(
    'SELECT apple_pay_domain_file FROM stores WHERE id = ?'
  ).bind('default').first<{ apple_pay_domain_file: string }>();

  const content = store?.apple_pay_domain_file || '';

  if (!content) {
    return new Response('Not configured', { status: 404 });
  }

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
