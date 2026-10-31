import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/Layout/AppLayout';
import { Login } from './pages/Login';
import { SetupAdmin } from './pages/SetupAdmin';
import { Dashboard } from './pages/Dashboard';
import { CandidateList } from './pages/CandidateList';
import { CandidateDetail } from './pages/CandidateDetail';
import { CandidateForm } from './pages/CandidateForm';
import { ResumeUpload } from './pages/ResumeUpload';
import { Followups } from './pages/Followups';
import { VisitorDashboard } from './pages/Visitors/VisitorDashboard';
import { Employees } from './pages/Employees';
import { Settings } from './pages/Settings';
import { ActivityLogs } from './pages/ActivityLogs';
import { Unauthorized, NotFound } from './pages/Unauthorized';
import { RefreshCw } from 'lucide-react';

const ProtectedRoute = ({ children, permission, adminOnly }) => {
  const { user, loading, isInitialized } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isInitialized) {
    return <Navigate to="/setup-admin" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  if (permission && user.role !== 'admin' && !user.permissions?.[permission]) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup-admin" element={<SetupAdmin />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected App Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="candidates" element={<CandidateList />} />
              <Route
                path="candidates/new"
                element={
                  <ProtectedRoute permission="can_edit">
                    <CandidateForm />
                  </ProtectedRoute>
                }
              />
              <Route path="candidates/:id" element={<CandidateDetail />} />
              <Route
                path="candidates/:id/edit"
                element={
                  <ProtectedRoute permission="can_edit">
                    <CandidateForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="upload"
                element={
                  <ProtectedRoute permission="can_upload">
                    <ResumeUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="followups"
                element={
                  <ProtectedRoute permission="can_followup">
                    <Followups />
                  </ProtectedRoute>
                }
              />
              <Route
                path="visitors"
                element={
                  <ProtectedRoute permission="can_visitors">
                    <VisitorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employees"
                element={
                  <ProtectedRoute adminOnly>
                    <Employees />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute adminOnly>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="activity-logs"
                element={
                  <ProtectedRoute adminOnly>
                    <ActivityLogs />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
