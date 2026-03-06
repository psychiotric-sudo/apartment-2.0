import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../pages/dashboards/AdminDashboard';
import BoarderDashboard from '../pages/dashboards/BoarderDashboard';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeleton';

const DashboardSkeleton = () => (
  <div className="fade-in" style={{ padding: '24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
      <div>
        <div className="skeleton" style={{ width: '120px', height: '28px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '200px', height: '14px' }} />
      </div>
      <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
    </div>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
      <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
    </div>

    <div style={{ marginBottom: '48px', height: '120px', borderRadius: '16px' }} className="skeleton" />
    
    <div style={{ marginBottom: '32px' }}>
      <div className="skeleton" style={{ width: '180px', height: '24px', marginBottom: '16px' }} />
      <TableSkeleton rows={4} />
    </div>
  </div>
);

const RoleBasedRouter = () => {
  const { user, loading, session } = useAuth();

  // If loading session or profile, show skeleton
  if (loading || (session && !user)) {
    return <DashboardSkeleton />;
  }

  // Fallback if user still null after loading
  if (!user) {
    return <DashboardSkeleton />;
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
