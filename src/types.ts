export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  active: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface StoreSettings {
  id: string;
  name: string;
  logo_url: string;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  stripe_publishable_key: string;
  venmo_handle: string;
  // stripe_secret_key never returned to frontend
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
  ENVIRONMENT: string;
  ALLOWED_ORIGIN: string;
}
