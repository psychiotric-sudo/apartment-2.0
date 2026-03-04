import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNotify } from './NotificationContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { showToast } = useNotify();

  const [session, setSession] = useState(() => {
    try {
      const storageKey = Object.keys(localStorage).find(key => key.includes('-auth-token'));
      if (storageKey) {
        const item = localStorage.getItem(storageKey);
        return item ? JSON.parse(item) : null;
      }
    } catch (e) { return null; }
    return null;
  });

  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('app-user-profile');
      return cached ? JSON.parse(cached) : null;
    } catch (e) { return null; }
  });

  const [loading, setLoading] = useState(!session || (session && !user));
  const [telemetry, setTelemetry] = useState([]);

  const log = (msg, data = '', type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] 🛡️ Auth: ${msg}`;
    console.log(logEntry, data);
    setTelemetry(prev => [...prev.slice(-9), logEntry]);
    
    if (msg.includes('Restored') || msg.includes('Verified') || msg.includes('Failed') || msg.includes('logged out')) {
      showToast(msg, type === 'error' ? 'error' : type === 'success' ? 'success' : 'info');
    }
  };

  const profileFetchRef = React.useRef(null);

  const fetchProfile = async (userId, isBackground = false) => {
    if (profileFetchRef.current === userId) return;
    profileFetchRef.current = userId;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        const cachedStr = localStorage.getItem('app-user-profile');
        const dataStr = JSON.stringify(data);
        const hasChanged = cachedStr !== dataStr;
        
        if (hasChanged) {
          setUser(data);
          localStorage.setItem('app-user-profile', dataStr);
          if (isBackground) log(`🔄 Profile Updated`, '', 'info');
        }

        if (!isBackground) {
          log(`✅ Session Verified: Welcome, ${data.name}`, '', 'success');
        }
      } else {
        const fallback = { id: userId, role: 'Boarder', name: 'User' };
        setUser(fallback);
        localStorage.setItem('app-user-profile', JSON.stringify(fallback));
      }
    } catch (e) {
      log(`❌ Sync Issue: ${e.message}`, '', 'error');
      if (!user) setUser({ id: userId, role: 'Boarder', name: 'Guest' });
    } finally {
      setLoading(false);
      profileFetchRef.current = null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      
      if (newSession) {
        setSession(newSession);
        if (!user || user.id !== newSession.user.id) {
          await fetchProfile(newSession.user.id, false);
        } else {
          fetchProfile(newSession.user.id, true);
          setLoading(false);
        }
      } else {
        handleClearAuth();
      }
    });

    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 2000);

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      clearTimeout(timeout);
    };
  }, [user]);

  const handleClearAuth = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('app-user-profile');
    setLoading(false);
  };

  const login = async (username, password) => {
    const email = `${username.trim().toLowerCase()}@local.app`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    localStorage.clear();
    handleClearAuth();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, login, logout, updatePassword, telemetry }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
