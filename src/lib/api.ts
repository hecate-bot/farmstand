import type { Product, StoreSettings } from '../types';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((err as { error?: string }).error || 'Request failed');
  }
  return res.json();
}

// Store
export const getSettings = (): Promise<StoreSettings> =>
  apiFetch('/api/settings');

export const updateSettings = (data: Partial<StoreSettings> & { stripe_secret_key?: string; admin_password?: string }): Promise<{ ok: boolean }> =>
  apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(data) });

// Products
export const getProducts = (adminMode = false): Promise<Product[]> =>
  apiFetch(`/api/products${adminMode ? '?admin=1' : ''}`);

export const createProduct = (data: Partial<Product>): Promise<Product> =>
  apiFetch('/api/products', { method: 'POST', body: JSON.stringify(data) });

export const updateProduct = (id: string, data: Partial<Product>): Promise<Product> =>
  apiFetch(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteProduct = (id: string): Promise<{ ok: boolean }> =>
  apiFetch(`/api/products/${id}`, { method: 'DELETE' });

// Auth
export const login = (password: string): Promise<{ token: string }> =>
  apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) });

export const verifyToken = (): Promise<{ valid: boolean }> =>
  apiFetch('/api/auth/verify');

// Upload
export const uploadFile = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error((err as { error?: string }).error || 'Upload failed');
  }
  return res.json();
};

// Checkout
export const createPaymentIntent = (items: { productId: string; quantity: number }[]): Promise<{ clientSecret: string }> =>
  apiFetch('/api/checkout/intent', { method: 'POST', body: JSON.stringify({ items }) });
