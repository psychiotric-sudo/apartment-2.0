import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { 
  LogOut, 
  Download,
  Settings
} from 'lucide-react';
import SettingsModal from '../components/modals/SettingsModal';

const AppLayout = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { showToast } = useNotify();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
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
      showToast("Data exported", "success");
    } catch (err) {
      showToast("Export failed", "error");
    }
  };

  return (
    <div className="app fade-in">
      <header style={{ 
        padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '40px', borderBottom: '1px solid var(--border)' 
      }}>
        <div className="header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--accent-gradient)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', boxShadow: '0 4px 12px var(--accent-glow)' }}>
              AD
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>AptManager</h1>
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span className={`badge ${user.role === 'Admin' ? 'badge-admin' : ''}`} style={{ fontSize: '9px' }}>
                    {user.role}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user?.role === 'Admin' && (
            <button className="icon-btn" onClick={handleExport} title="Export Backup"><Download size={18} /></button>
          )}
          
          <button className="icon-btn" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={18} />
          </button>

          <button className="btn btn-danger" onClick={handleLogout} style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
            <LogOut size={18} />
            <span className="hide-mobile">Logout</span>
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />
    </div>
  );
};

export default AppLayout;
