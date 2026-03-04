import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
    
    if (Notification.permission === "granted") {
      sendBrowserNotification(type.toUpperCase(), message);
    }
  }, [removeToast]);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      showToast("Notifications enabled!", "success");
    }
  };

  const sendBrowserNotification = (title, body) => {
    if (Notification.permission === "granted") {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body,
            icon: '/logo.svg',
            badge: '/logo.svg',
            vibrate: [100, 50, 100],
          });
        });
      } else {
        new Notification(title, { body, icon: '/logo.svg' });
      }
    }
  };

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const channel = supabase.channel('push-notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'expenses',
          filter: `boarder_id=eq.${session.user.id}` 
        }, (payload) => {
          sendBrowserNotification('New Debt Recorded', `You have a new expense: ${payload.new.category} for ₱${payload.new.amount}`);
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'expenses',
          filter: `boarder_id=eq.${session.user.id}` 
        }, (payload) => {
          if (payload.new.status === 'Paid') {
            sendBrowserNotification('Debt Cleared', `Your ${payload.new.category} expense has been marked as Paid.`);
          }
        })
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'payments',
          filter: `boarder_id=eq.${session.user.id}` 
        }, (payload) => {
          sendBrowserNotification('Payment Received', `A payment of ₱${payload.new.amount} has been recorded.`);
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    };

    setupRealtime();
  }, []);

  return (
    <NotificationContext.Provider value={{ showToast, sendBrowserNotification, requestPermission }}>
      {children}
      <div style={{ 
        position: 'fixed', top: '24px', right: '24px', zIndex: 9999, 
        display: 'flex', flexDirection: 'column', gap: '10px' 
      }}>
        {toasts.map((t) => (
          <div key={t.id} className={`glass-card toast toast-${t.type}`} style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', 
            borderLeft: t.type === 'success' ? '4px solid var(--success)' : t.type === 'error' ? '4px solid var(--danger)' : '4px solid var(--accent)',
            animation: 'slideInRight 0.3s ease-out'
          }}>
            {t.type === 'success' && <CheckCircle size={18} color="var(--success)" />}
            {t.type === 'error' && <AlertCircle size={18} color="var(--danger)" />}
            {t.type === 'info' && <Info size={18} color="var(--accent)" />}
            <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{t.message}</span>
            <button onClick={() => removeToast(t.id)} style={{ opacity: 0.5, marginLeft: '10px' }}><X size={16} /></button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => useContext(NotificationContext);
