import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { logout, getSettings } from '../../lib/api';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    getSettings().then((s) => setLogoUrl(s.logo_url || '')).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout().catch(() => {});
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-600 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-gray-100 border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {logoUrl
              ? <img src={logoUrl} alt="logo" className="h-8 w-8 rounded object-contain mr-2" />
              : <span className="text-lg mr-3">🌾</span>
            }
            <NavLink to="/admin/products" className={navClass}>Products</NavLink>
            <NavLink to="/admin/settings" className={navClass}>Settings</NavLink>
            <NavLink to="/admin/qrcode" className={navClass}>QR Code</NavLink>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              View Store ↗
            </a>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
