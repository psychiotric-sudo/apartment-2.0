import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../pages/dashboards/AdminDashboard';
import BoarderDashboard from '../pages/dashboards/BoarderDashboard';

const RoleBasedRouter = () => {
  const { user, loading, session } = useAuth();

  if (loading && !session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px', color: 'var(--text2)' }}>
        <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', marginRight: '12px' }} />
        Verifying session...
      </div>
    );
  }

  if (session && !user && loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
        <div style={{ color: 'var(--text2)', fontSize: '14px', fontWeight: '500' }}>FETCHING PROFILE...</div>
      </div>
    );
  }

  if (!loading && !user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: 'var(--surface)', margin: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '12px' }}>Profile Not Found</h3>
        <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>Your account exists, but your role profile is missing.</p>
      </div>
    );
  }

  const role = user?.role?.toLowerCase();
  if (role === 'admin' || role === 'topman') return <AdminDashboard />;
  if (role === 'boarder') return <BoarderDashboard />;

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h3>Unauthorized</h3>
      <p>Invalid Role: {user?.role}</p>
    </div>
  );
};

export default RoleBasedRouter;
