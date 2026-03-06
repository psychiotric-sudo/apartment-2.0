import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { 
  LogOut, Download, Settings, Bell, 
  Activity, Clock, LayoutGrid, RefreshCw, ShieldCheck
} from 'lucide-react';
import SettingsModal from '../components/modals/SettingsModal';
import NotificationsModal from '../components/modals/NotificationsModal';
import NewActivityModal from '../components/modals/NewActivityModal';

const AppLayout = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const { user, logout } = useAuth();
  const { showToast, unreadCount, notifications } = useNotify();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.role === 'Boarder' && unreadCount > 0 && !isNewActivityOpen) {
      const lastSeenNotifId = localStorage.getItem(`lastSeenNotif_${user.id}`);
      const latestNotifId = notifications.filter(n => !n.is_read)[0]?.id;
      if (latestNotifId && lastSeenNotifId !== latestNotifId) {
        setIsNewActivityOpen(true);
      }
    }
  }, [user, unreadCount, notifications, isNewActivityOpen]);

  const handleAcknowledge = () => {
    if (notifications.length > 0) {
      const latestNotifId = notifications.filter(n => !n.is_read)[0]?.id;
      if (latestNotifId) {
        localStorage.setItem(`lastSeenNotif_${user.id}`, latestNotifId);
      }
    }
    setIsNewActivityOpen(false);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleLogout = async () => {
    setIsExiting(true);
    // Add artificial delay for visual polish
    setTimeout(async () => {
      await logout();
      navigate('/login', { replace: true });
    }, 1500);
  };

  const handleExport = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: expenses } = await supabase.from('expenses').select('*');
      const { data: payments } = await supabase.from('payments').select('*');
      const backup = { profiles, expenses, payments, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apt_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast("Backup generated", "success");
    } catch (err) {
      showToast("Export failed", "error");
    }
  };

  return (
    <div className="app fade-in">
      {/* EXIT OVERLAY */}
      {isExiting && (
        <div className="modal-overlay active" style={{ zIndex: 100000, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)' }}>
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ width: '80px', height: '80px', background: 'var(--accent-gradient)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px var(--accent-glow)' }}>
              <ShieldCheck size={40} color="white" className="animate-pulse" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>Securing Session...</h2>
            <p style={{ color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <RefreshCw size={14} className="animate-spin" /> Disconnecting from system
            </p>
          </div>
        </div>
      )}

      <header style={{ padding: '28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'var(--accent-gradient)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 32px var(--accent-glow)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <LayoutGrid size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '950', color: 'white', letterSpacing: '-1px' }}>AptManager</h1>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--accent)' }}>{user.role}</span>
                <div style={{ height: '3px', width: '3px', borderRadius: '50%', background: 'var(--text2)', opacity: 0.3 }}></div>
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text2)', opacity: 0.6 }}>
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {user?.role === 'Admin' && (
            <button className="icon-btn" onClick={handleExport} title="Export System Data" style={{ width: '46px', height: '46px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--accent-glow)' }}>
              <Download size={18} color="var(--accent)" />
            </button>
          )}
          
          {user?.role === 'Boarder' && (
            <button className="icon-btn" onClick={() => setIsNotificationsOpen(true)} style={{ position: 'relative', width: '46px', height: '46px', background: unreadCount > 0 ? 'rgba(99, 102, 241, 0.08)' : '' }}>
              <Bell size={20} color={unreadCount > 0 ? 'white' : 'var(--text2)'} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg)', boxShadow: '0 0 10px var(--danger)' }}></span>
              )}
            </button>
          )}

          <button className="icon-btn" onClick={() => setIsSettingsOpen(true)} style={{ width: '46px', height: '46px' }}>
            <Settings size={20} />
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }} />

          <button className="btn btn-danger" onClick={handleLogout} style={{ padding: '0 16px', borderRadius: '12px', height: '46px', fontSize: '12px', fontWeight: '800', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
            <LogOut size={16} /> <span className="hide-mobile">LOGOUT</span>
          </button>
        </div>
      </header>

      <main><Outlet /></main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
      <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <NewActivityModal isOpen={isNewActivityOpen} onClose={handleAcknowledge} notifications={notifications.filter(n => !n.is_read)} />
    </div>
  );
};

export default AppLayout;
