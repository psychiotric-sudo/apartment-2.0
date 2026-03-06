import React, { useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { validateConfig } from './config';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RoleBasedRouter from './routes/RoleBasedRouter';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import DataValidator from './components/common/DataValidator';

const PublicRoute = ({ children }) => {
  const { session, loading } = useAuth();
  if (loading && !session) return null;
  return session ? <Navigate to="/dashboard" replace /> : children;
};

const RootRedirect = () => {
  const { session, loading } = useAuth();
  if (loading) return (
    <div style={{ background: '#050608', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid #1a1b1e', borderTopColor: '#3b82f6', borderRadius: '50%' }} />
    </div>
  );
  return session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function App() {
  const configStatus = useMemo(() => validateConfig(), []);

  if (!configStatus.isValid) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#f43f5e', background: '#050608', height: '100vh' }}>
        <h2>Config Error</h2>
        <p>{configStatus.error}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <DataValidator />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<RoleBasedRouter />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
