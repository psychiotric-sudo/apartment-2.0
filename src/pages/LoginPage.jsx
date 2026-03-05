import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { LogIn, User, Lock, RefreshCw } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, session } = useAuth();
  const { showToast } = useNotify();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      // Navigation will be handled by the useEffect above once session updates
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg)', padding: '20px' }}>
      <div className="glass-card fade-in" style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--accent-gradient)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '24px', margin: '0 auto 16px auto', boxShadow: '0 8px 24px var(--accent-glow)' }}>
            AD
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white' }}>AptManager</h2>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '4px' }}>Sign in to manage your residence</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="field">
            <label>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)', opacity: 0.5 }} />
              <input 
                type="text" value={username} onChange={(e) => setUsername(e.target.value)} 
                placeholder="Enter username" required style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>

          <div className="field">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)', opacity: 0.5 }} />
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter password" required style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <><LogIn size={20} /> Sign In</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
