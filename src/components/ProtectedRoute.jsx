import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading && !session) {
    return (
      <div style={{ 
        display: 'flex', flexDirection: 'column', gap: '12px',
        justifyContent: 'center', alignItems: 'center', height: '100vh', 
        background: 'var(--bg)', color: 'var(--text2)' 
      }}>
        <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
        <div style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '1px' }}>SYNCHRONIZING...</div>
      </div>
    );
  }

  if (!session && !loading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
