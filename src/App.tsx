import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import OverviewPage from '@/pages/dashboard/OverviewPage';
import ApiKeysPage from '@/pages/dashboard/ApiKeysPage';
import UsagePage from '@/pages/dashboard/UsagePage';
import AnalyticsPage from '@/pages/dashboard/AnalyticsPage';
import WebhooksPage from '@/pages/dashboard/WebhooksPage';
import BillingPage from '@/pages/dashboard/BillingPage';
import SettingsPage from '@/pages/dashboard/SettingsPage';
import AccountPage from '@/pages/dashboard/AccountPage';
import TeamPage from '@/pages/dashboard/TeamPage';
import ActivityLogPage from '@/pages/dashboard/ActivityLogPage';
import NotificationsPage from '@/pages/dashboard/NotificationsPage';
import ApiLogsPage from '@/pages/dashboard/ApiLogsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <DashboardLayout />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
            <Route path="usage" element={<UsagePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="activity-log" element={<ActivityLogPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="api-logs" element={<ApiLogsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
