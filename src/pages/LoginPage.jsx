import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { LogIn, User, Lock, RefreshCw, Eye, EyeOff, ShieldCheck, Cpu, Globe } from 'lucide-react';
import { config } from '../config';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const { login, session } = useAuth();
  const { showToast } = useNotify();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setIsAuthenticating(true);
    
    try {
      await login(username, password);
    } catch (err) {
      showToast(err.message || "Access Denied", "error");
      setLoading(false);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="login-container" style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      minHeight: '100vh', background: 'var(--bg)', padding: '24px',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* AUTHENTICATING OVERLAY */}
      {isAuthenticating && (
        <div className="modal-overlay active" style={{ zIndex: 100000, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '80px', height: '80px', background: 'var(--accent-gradient)', 
              borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 24px', boxShadow: '0 0 40px var(--accent-glow)',
              animation: 'pulse 2s infinite'
            }}>
              <ShieldCheck size={40} color="white" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '950', color: 'white', marginBottom: '8px', letterSpacing: '-1px' }}>Authenticating...</h2>
            <p style={{ color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
              <RefreshCw size={14} className="animate-spin" /> Verifying system credentials
            </p>
          </div>
        </div>
      )}

      {/* Background Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 }} />
      
      {/* Tech Elements */}
      <div style={{ position: 'absolute', top: '15%', left: '15%', opacity: 0.1, color: 'var(--accent)' }}><Cpu size={120} strokeWidth={0.5} /></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', opacity: 0.08, color: 'var(--accent)' }}><Globe size={180} strokeWidth={0.5} /></div>

      <div className="glass-card fade-in" style={{ maxWidth: '420px', width: '100%', padding: '48px 40px', zIndex: 1, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', opacity: 0.5 }} />
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '72px', height: '72px', background: 'var(--accent-gradient)', 
            borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: 'white', margin: '0 auto 20px auto', 
            boxShadow: '0 8px 32px var(--accent-glow)',
            transform: 'rotate(-5deg)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <ShieldCheck size={36} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '950', color: 'white', letterSpacing: '-1.5px' }}>AptManager</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
            <p style={{ color: 'var(--text2)', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em' }}>CORE PROTOCOL</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div className="field">
            <label>IDENTIFIER</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', opacity: 0.6 }} />
              <input 
                type="text" value={username} onChange={(e) => setUsername(e.target.value)} 
                placeholder="USERNAME" required 
                style={{ paddingLeft: '48px', height: '56px', borderRadius: '14px', background: '#000', border: '1px solid var(--border-bright)' }}
              />
            </div>
          </div>

          <div className="field">
            <label>ACCESS KEY</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', opacity: 0.6 }} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" required 
                style={{ paddingLeft: '48px', paddingRight: '48px', height: '56px', borderRadius: '14px', background: '#000', border: '1px solid var(--border-bright)' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: '4px' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', height: '60px', marginTop: '8px', fontSize: '16px', borderRadius: '16px', gap: '12px' }} disabled={loading}>
            <LogIn size={22} /> <span>INITIALIZE LOGIN</span>
          </button>
        </form>

        <div style={{ marginTop: '48px', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', opacity: 0.4 }}>
            <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em' }}>V{config.version || '4.0.VNK2'}</div>
            <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em' }}>ENCRYPTED</div>
            <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em' }}>AES-256</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
