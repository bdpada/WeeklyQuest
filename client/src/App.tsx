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
import { QuestionSetEditorPage } from './pages/QuestionSetEditorPage';
import { QuestionSetSubmissionPage } from './pages/QuestionSetSubmissionPage';
import { AdminGradingPage } from './pages/AdminGradingPage';
import { GroupLeaderboardPage } from './pages/GroupLeaderboardPage';
import { QuestionSetLeaderboardPage } from './pages/QuestionSetLeaderboardPage';
import { ScoreHistoryPage } from './pages/ScoreHistoryPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminUserDetailPage } from './pages/AdminUserDetailPage';

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
            <Route path="/question-sets/:questionSetId" element={<QuestionSetSubmissionPage />} />
            <Route path="/scores" element={<ScoreHistoryPage />} />
            <Route path="/question-sets/:questionSetId/leaderboard" element={<QuestionSetLeaderboardPage />} />
            <Route path="/groups/:groupId/leaderboard" element={<GroupLeaderboardPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/groups" element={<AdminGroupsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
              <Route path="/admin/groups/:groupId" element={<AdminGroupDetailPage />} />
              <Route path="/admin/groups/:groupId/question-sets/new" element={<QuestionSetEditorPage />} />
              <Route path="/admin/question-sets/:questionSetId/edit" element={<QuestionSetEditorPage />} />
              <Route path="/admin/question-sets/:questionSetId/grading" element={<AdminGradingPage />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </main>
  );
}

export default App;
