import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#080c14' }}>
      <div className="spinner" />
    </div>
  );
}

export function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/seller/catalog'} replace />;
  }
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/seller/catalog'} replace />;
  }
  return <Outlet />;
}
