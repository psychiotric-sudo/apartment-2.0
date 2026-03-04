import React, { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { validateConfig } from './config';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RoleBasedRouter from './routes/RoleBasedRouter';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import DataValidator from './components/common/DataValidator';

const PublicRoute = ({ children }) => {
  const { session } = useAuth();
  return session ? <Navigate to="/" replace /> : children;
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
      <AuthProvider>
        <DataValidator />
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<RoleBasedRouter />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
