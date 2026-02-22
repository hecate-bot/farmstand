import { useState, useEffect } from 'react';
import type { Product } from '../../types';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadFile } from '../../lib/api';

const emptyForm = {
  name: '',
  description: '',
  price_cents: 0,
  price_dollars: '',
  image_url: '',
  active: 1,
  sort_order: 0,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getProducts(true)
      .then(setProducts)
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (product: Product) => {
    setEditing(product);
    setIsNew(false);
    setForm({
      name: product.name,
      description: product.description,
      price_cents: product.price_cents,
      price_dollars: (product.price_cents / 100).toFixed(2),
      image_url: product.image_url,
      active: product.active,
      sort_order: product.sort_order,
    });
  };

  const openNew = () => {
    setEditing(null);
    setIsNew(true);
    setForm(emptyForm);
  };

  const closeForm = () => {
    setEditing(null);
    setIsNew(false);
    setError('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { url } = await uploadFile(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      setError('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const data = {
      name: form.name,
      description: form.description,
      price_cents: Math.round(parseFloat(form.price_dollars || '0') * 100),
      image_url: form.image_url,
      active: form.active,
      sort_order: form.sort_order,
    };

    try {
      if (isNew) {
        await createProduct(data);
      } else if (editing) {
        await updateProduct(editing.id, data);
      }
      closeForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      load();
    } catch {
      setError('Delete failed');
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      await updateProduct(product.id, { active: product.active ? 0 : 1 });
      load();
    } catch {
      setError('Update failed');
    }
  };

  const showForm = isNew || editing !== null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Products</h2>
        {!showForm && (
          <button onClick={openNew} className="btn-primary py-2 px-4 text-sm">
            + Add Product
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Product Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {isNew ? 'New Product' : `Edit: ${editing?.name}`}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input"
                placeholder="e.g. Sourdough Bread"
                required
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="input resize-none"
                rows={2}
                placeholder="Optional short description"
              />
            </div>

            <div>
              <label className="label">Price *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price_dollars}
                  onChange={(e) => setForm((f) => ({ ...f, price_dollars: e.target.value }))}
                  className="input pl-8"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Image</label>
              <div className="flex gap-3 items-start">
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="Product"
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700"
                  />
                  {uploadingImage && (
                    <p className="text-xs text-gray-400 mt-1">Uploading…</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="label mb-0">Active</label>
              <input
                type="checkbox"
                checked={form.active === 1}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked ? 1 : 0 }))}
                className="w-5 h-5 rounded"
              />
            </div>

            <div>
              <label className="label">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                className="input"
                min="0"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary py-2 px-6 flex-1">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={closeForm} className="py-2 px-6 rounded-xl border border-gray-200 text-gray-600 font-medium">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product list */}
      {loading ? (
        <p className="text-gray-400 animate-pulse">Loading…</p>
      ) : products.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          <p>No products yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className={`card p-4 flex gap-4 items-center ${!p.active ? 'opacity-50' : ''}`}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-2xl">🌾</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="text-sm text-gray-500">
                  ${(p.price_cents / 100).toFixed(2)}
                  {!p.active && <span className="ml-2 text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">Hidden</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(p)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  {p.active ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
