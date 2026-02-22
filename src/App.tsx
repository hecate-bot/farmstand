import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Store from './pages/Store';
import Login from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Products from './pages/admin/Products';
import Settings from './pages/admin/Settings';
import QRCode from './pages/admin/QRCode';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/admin/products" replace />} />
          <Route path="products" element={<Products />} />
          <Route path="settings" element={<Settings />} />
          <Route path="qrcode" element={<QRCode />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
