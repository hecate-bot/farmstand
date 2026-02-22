import type { Env } from '../../../src/types';
import { verifyToken } from '../auth/verify';

interface PagesContext {
  request: Request;
  env: Env;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
  const isAdmin = await verifyToken(request, env);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ error: 'File type not allowed. Use JPEG, PNG, WebP, GIF, or SVG.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large. Maximum size is 5MB.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  await env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const r2PublicUrl = env.R2_PUBLIC_URL || '';
  const url = `${r2PublicUrl}/${key}`;

  return new Response(JSON.stringify({ url, key }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204 });
}
