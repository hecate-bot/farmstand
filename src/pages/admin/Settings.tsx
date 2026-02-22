import { useState, useEffect } from 'react';
import type { StoreSettings } from '../../types';
import { getSettings, updateSettings, uploadFile } from '../../lib/api';
import ColorPicker from '../../components/ColorPicker';

export default function Settings() {
  const [form, setForm] = useState<Partial<StoreSettings> & {
    stripe_secret_key?: string;
    admin_password?: string;
    confirm_password?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSettings()
      .then((s) => setForm(s))
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { url } = await uploadFile(file);
      setForm((f) => ({ ...f, logo_url: url }));
    } catch {
      setError('Logo upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.admin_password && form.admin_password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    setError('');

    const payload = { ...form };
    delete payload.confirm_password;
    if (!payload.admin_password) delete payload.admin_password;

    try {
      await updateSettings(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-400 animate-pulse">Loading…</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Settings</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm">
          ✓ Settings saved
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Identity */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Store Identity</h3>

          <div>
            <label className="label">Store Name</label>
            <input
              type="text"
              value={form.name || ''}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
              placeholder="Paleo Treats Farm Stand"
            />
          </div>

          <div>
            <label className="label">Logo</label>
            <div className="flex gap-4 items-center">
              {form.logo_url && (
                <img src={form.logo_url} alt="Logo" className="h-16 w-auto rounded-xl object-contain bg-gray-50 p-1" />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700"
                />
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP or GIF · 160×160 px recommended · max 5 MB</p>
                {uploadingLogo && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Brand Colors</h3>
          <ColorPicker
            label="Primary (header, buttons, prices)"
            value={form.color_primary || '#2D5016'}
            onChange={(v) => setForm((f) => ({ ...f, color_primary: v }))}
          />
          <ColorPicker
            label="Secondary (background)"
            value={form.color_secondary || '#F5F0E8'}
            onChange={(v) => setForm((f) => ({ ...f, color_secondary: v }))}
          />
          <ColorPicker
            label="Accent"
            value={form.color_accent || '#8B4513'}
            onChange={(v) => setForm((f) => ({ ...f, color_accent: v }))}
          />
          {/* Live preview */}
          <div className="rounded-xl p-4 mt-2" style={{ backgroundColor: form.color_secondary || '#F5F0E8' }}>
            <p className="text-sm font-semibold" style={{ color: form.color_primary || '#2D5016' }}>Preview: Store Name</p>
            <button className="mt-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: form.color_accent || '#8B4513' }}>
              Accent Button
            </button>
          </div>
        </div>

        {/* Payments */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Payments</h3>

          <div>
            <label className="label">Stripe Publishable Key</label>
            <input
              type="text"
              value={form.stripe_publishable_key || ''}
              onChange={(e) => setForm((f) => ({ ...f, stripe_publishable_key: e.target.value }))}
              className="input font-mono text-sm"
              placeholder="pk_live_..."
            />
          </div>

          <div>
            <label className="label">Stripe Secret Key</label>
            <input
              type="password"
              value={form.stripe_secret_key || ''}
              onChange={(e) => setForm((f) => ({ ...f, stripe_secret_key: e.target.value }))}
              className="input font-mono text-sm"
              placeholder="sk_live_... (leave blank to keep existing)"
            />
            <p className="text-xs text-gray-400 mt-1">Leave blank to keep the existing key. Never exposed to the frontend.</p>
          </div>

          <div>
            <label className="label">Venmo Handle</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input
                type="text"
                value={form.venmo_handle || ''}
                onChange={(e) => setForm((f) => ({ ...f, venmo_handle: e.target.value }))}
                className="input pl-8"
                placeholder="paleotreats"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400 pt-1">
            Apple Pay domain verification is handled automatically. Register your domain in Stripe Dashboard → Settings → Payment method domains.
          </p>
        </div>

        {/* Admin Password */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Admin Password</h3>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={form.admin_password || ''}
              onChange={(e) => setForm((f) => ({ ...f, admin_password: e.target.value }))}
              className="input"
              placeholder="Leave blank to keep current"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              value={form.confirm_password || ''}
              onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
              className="input"
              placeholder="Repeat new password"
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full btn-primary py-4">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
