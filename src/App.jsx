import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import LoginPage from './components/auth/LoginPage';
import AdminLayout from './components/shared/AdminLayout';
import KioskPage from './pages/KioskPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVisits from './pages/admin/AdminVisits';
import AdminUsers from './pages/admin/AdminUsers';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'admin') return <Navigate to="/kiosk" replace />;
  return children;
}

function RoleRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/kiosk" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <RoleRedirect /> : <LoginPage />} />
      <Route path="/kiosk" element={<RequireAuth><KioskPage /></RequireAuth>} />
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="visits" element={<AdminVisits />} />
        <Route path="users"  element={<AdminUsers />} />
        <Route path="kiosk"  element={<KioskPage />} />
      </Route>
      <Route path="*" element={user ? <RoleRedirect /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
