import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function AdminRoute() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <p className="text-slate-600">Checking permissions...</p>;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
