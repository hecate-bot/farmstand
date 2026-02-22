import { useState, useEffect } from 'react';
import type { Product, StoreSettings, CartItem } from '../types';
import { getSettings, getProducts } from '../lib/api';
import ProductCard from '../components/ProductCard';
import CheckoutBar from '../components/CheckoutBar';

export default function Store() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getSettings(), getProducts()])
      .then(([s, p]) => {
        setSettings(s);
        setProducts(p);
        // Apply brand colors
        const root = document.documentElement;
        root.style.setProperty('--color-primary', s.color_primary);
        root.style.setProperty('--color-secondary', s.color_secondary);
        root.style.setProperty('--color-accent', s.color_accent);
        // Update meta theme-color
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', s.color_primary);
        // Update page title
        document.title = s.name;
      })
      .catch(() => setError('Unable to load store. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const setQuantity = (productId: string, qty: number) => {
    setCart((prev) => ({ ...prev, [productId]: qty }));
  };

  const cartItems: CartItem[] = products
    .filter((p) => (cart[p.id] || 0) > 0)
    .map((p) => ({ product: p, quantity: cart[p.id] }));

  const hasCart = cartItems.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 text-lg animate-pulse">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🌾</div>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-secondary)' }}
    >
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <header className="pt-8 pb-6 flex flex-col items-center text-center">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings?.name}
              className="h-16 w-auto object-contain mb-3"
            />
          ) : (
            <div className="text-5xl mb-3">🌾</div>
          )}
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {settings?.name || 'Farm Stand'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Pick what you'd like and pay below</p>
        </header>

        {/* Products */}
        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No products available right now.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={cart[product.id] || 0}
                onQuantityChange={(q) => setQuantity(product.id, q)}
              />
            ))}
          </div>
        )}

        {/* Bottom padding for checkout bar */}
        <div className={hasCart ? 'h-48' : 'h-16'} />
      </div>

      {/* Checkout bar */}
      {settings && (
        <CheckoutBar cart={cartItems} settings={settings} />
      )}
    </div>
  );
}
