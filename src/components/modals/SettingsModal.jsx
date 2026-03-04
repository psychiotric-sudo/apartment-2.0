import React, { useState } from 'react';
import { X, User, Moon, Sun, Shield, Save, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { supabase } from '../../lib/supabase';

const SettingsModal = ({ isOpen, onClose, isDark, onToggleTheme }) => {
  const { user, updatePassword } = useAuth();
  const { showToast } = useNotify();
  const [name, setName] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from('profiles').update({ name }).eq('id', user.id);
      showToast("Profile updated!", "success");
      onClose();
    } catch (err) { showToast(err.message, "error"); } finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match!", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setPassLoading(true);
    try {
      await updatePassword(newPassword);
      showToast("Password updated successfully!", "success");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '440px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800' }}>App Settings</h3>
          <button onClick={onClose} className="icon-btn" style={{ border: 'none', background: 'none' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="field">
            <label style={{ fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Appearance</label>
            <button onClick={onToggleTheme} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--glass-light)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{isDark ? <Moon size={18} /> : <Sun size={18} />}<span style={{ fontWeight: '600' }}>{isDark ? 'Dark Mode' : 'Light Mode'}</span></div>
              <div style={{ width: '40px', height: '20px', background: isDark ? 'var(--accent)' : '#cbd5e1', borderRadius: '20px', position: 'relative' }}>
                <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: isDark ? '22px' : '2px', transition: 'all 0.2s ease' }} />
              </div>
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="field">
            <label style={{ fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Personal Info</label>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.1)', fontSize: '12px', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={14} /> Role: {user?.role}</div>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}><Save size={18} /> Save Profile</button>
            </div>
          </form>

          <form onSubmit={handlePasswordChange} className="field" style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <label style={{ fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Security</label>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="New Password" required style={{ paddingLeft: '44px' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm New Password" required style={{ paddingLeft: '44px' }}
                />
              </div>
              <button className="btn btn-secondary" style={{ width: '100%', borderColor: 'var(--border-bright)' }} disabled={passLoading}>
                {passLoading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text2)' }}>AptManager v1.2</p>
            <p style={{ fontSize: '11px', color: 'var(--text2)' }}>Developer: <a href="https://facebook.com/chqrlzz" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '700' }}>@chqrlzz</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
