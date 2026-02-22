// Stripe publishes the Apple Pay domain association file at a canonical URL.
// We proxy it here so Apple can verify this domain for Apple Pay.
export async function onRequestGet(): Promise<Response> {
  const res = await fetch(
    'https://stripe.com/files/apple-pay/apple-developer-merchantid-domain-association'
  );

  if (!res.ok) {
    return new Response('Could not fetch Apple Pay domain association file', { status: 502 });
  }

  const content = await res.text();

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
