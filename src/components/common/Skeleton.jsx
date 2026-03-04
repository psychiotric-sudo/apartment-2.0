import React from 'react';

export const Skeleton = ({ width, height, borderRadius = '8px', style }) => (
  <div className="skeleton" style={{ width, height, borderRadius, ...style }} />
);

export const CardSkeleton = () => (
  <div className="glass-card" style={{ padding: '24px' }}>
    <Skeleton width="40%" height="12px" style={{ marginBottom: '12px' }} />
    <Skeleton width="70%" height="32px" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
    <div style={{ padding: '16px 24px', background: 'var(--glass-light)' }}>
      <Skeleton width="100%" height="20px" />
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '20px' }}>
        <Skeleton width="30%" height="16px" />
        <Skeleton width="20%" height="16px" />
        <Skeleton width="20%" height="16px" />
        <Skeleton width="20%" height="16px" style={{ marginLeft: 'auto' }} />
      </div>
    ))}
  </div>
);
