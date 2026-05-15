import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute } from './components/routes/AdminRoute';
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminGroupDetailPage } from './pages/AdminGroupDetailPage';
import { AdminGroupsPage } from './pages/AdminGroupsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';

function App() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/groups" element={<AdminGroupsPage />} />
              <Route path="/admin/groups/:groupId" element={<AdminGroupDetailPage />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </main>
  );
}

export default App;
