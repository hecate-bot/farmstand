import { useState, useEffect } from 'react';
import { getSettings } from '../../lib/api';

export default function QRCode() {
  const [storeName, setStoreName] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    getSettings()
      .then((s) => setStoreName(s.name))
      .catch(() => {});
  }, []);

  const storeUrl = customUrl || window.location.origin + '/';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=20&data=${encodeURIComponent(storeUrl)}`;

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    const res = await fetch(qrUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'farmstand-qr.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">QR Code</h2>

      <div className="card p-6 max-w-md">
        <div className="mb-4">
          <label className="label">Store URL</label>
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="input"
            placeholder={storeUrl}
          />
          <p className="text-xs text-gray-400 mt-1">
            Override if your store is at a custom domain (e.g. farmstand.paleotreats.com)
          </p>
        </div>

        <div className="flex flex-col items-center bg-white rounded-2xl p-4 border border-gray-100">
          <img
            src={qrUrl}
            alt="Store QR Code"
            className="w-64 h-64"
          />
          <p className="text-sm text-gray-500 mt-3 text-center font-medium">{storeName}</p>
          <p className="text-xs text-gray-400 text-center break-all mt-1">{storeUrl}</p>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={handleDownload} className="btn-primary flex-1 py-3 text-sm">
            ⬇ Download PNG
          </button>
          <button onClick={handlePrint} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-medium">
            🖨 Print
          </button>
        </div>

        <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
          <strong>Tip:</strong> Print at 3×3" or larger for best scannability. Test with your phone before placing on the table.
        </div>
      </div>
    </div>
  );
}
