import React from 'react';

export const StatCard = ({ label, value, icon: Icon, color = 'var(--accent)', trend }) => (
  <div className="glass-card stat-card" style={{ 
    padding: '24px', 
    position: 'relative', 
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'rgba(255, 255, 255, 0.02)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
        <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', marginTop: '8px' }}>{value}</div>
      </div>
      <div style={{ 
        padding: '12px', 
        borderRadius: '12px', 
        background: `rgba(${color === 'var(--danger)' ? '239, 68, 68' : color === 'var(--success)' ? '34, 197, 94' : '108, 140, 255'}, 0.1)`, 
        color: color 
      }}>
        {Icon && <Icon size={22} />}
      </div>
    </div>
    {trend && (
      <div style={{ fontSize: '12px', fontWeight: '600', color: trend.startsWith('+') ? 'var(--success)' : 'var(--text2)' }}>
        {trend} <span style={{ opacity: 0.5, fontWeight: '400' }}>vs last month</span>
      </div>
    )}
    <div style={{ 
      position: 'absolute', bottom: '-10px', right: '-10px', 
      opacity: 0.03, transform: 'rotate(-15deg)' 
    }}>
      {Icon && <Icon size={80} />}
    </div>
  </div>
);

export const DashboardHeader = ({ title, description, children }) => (
  <div style={{ 
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', 
    marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' 
  }}>
    <div>
      <h2 style={{ 
        fontSize: '32px', fontWeight: '900', marginBottom: '4px', letterSpacing: '-1px',
        color: 'white'
      }}>
        {title}
      </h2>
      <p style={{ color: 'var(--text2)', fontSize: '14px', fontWeight: '500' }}>{description}</p>
    </div>
    <div style={{ display: 'flex', gap: '12px' }}>
      {children}
    </div>
  </div>
);

export const Section = ({ title, children, action, icon: Icon }) => (
  <div style={{ marginBottom: '48px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {Icon && <Icon size={18} style={{ color: 'var(--accent)' }} />}
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px', margin: 0 }}>{title}</h3>
      </div>
      {action}
    </div>
    {children}
  </div>
);
