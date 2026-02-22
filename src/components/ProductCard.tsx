import type { Product } from '../types';
import QuantityStepper from './QuantityStepper';

interface Props {
  product: Product;
  quantity: number;
  onQuantityChange: (q: number) => void;
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export default function ProductCard({ product, quantity, onQuantityChange }: Props) {
  return (
    <div className="card flex gap-4 p-4">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div
          className="w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl"
          style={{ backgroundColor: 'var(--color-secondary)' }}
        >
          🌾
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-base leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-500 mt-0.5 leading-snug line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
            {formatPrice(product.price_cents)}
          </span>
          <QuantityStepper value={quantity} onChange={onQuantityChange} />
        </div>
      </div>
    </div>
  );
}
