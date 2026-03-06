import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

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

  const fetchNotifications = useCallback(async (userId) => {
    if (!userId) return;

    // Fetch from both tables where notif_title is present
    const [expensesRes, paymentsRes] = await Promise.all([
      supabase.from('expenses')
        .select('id, notif_title, notif_message, is_read, created_at, category, amount')
        .eq('boarder_id', userId)
        .not('notif_title', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('payments')
        .select('id, notif_title, notif_message, is_read, created_at, category, amount')
        .eq('boarder_id', userId)
        .not('notif_title', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const combined = [
      ...(expensesRes.data || []).map(e => ({ ...e, type: 'warning', table: 'expenses' })),
      ...(paymentsRes.data || []).map(p => ({ ...p, type: 'success', table: 'payments' }))
    ]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 20);

    setNotifications(combined);
    setUnreadCount(combined.filter(n => !n.is_read).length);
  }, []);

  const markAsRead = async (id, table) => {
    const { error } = await supabase
      .from(table)
      .update({ is_read: true })
      .eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!currentUserId) return;

    await Promise.all([
      supabase.from('expenses').update({ is_read: true }).eq('boarder_id', currentUserId).eq('is_read', false),
      supabase.from('payments').update({ is_read: true }).eq('boarder_id', currentUserId).eq('is_read', false)
    ]);
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      showToast("Notifications enabled!", "success");
    }
  };

  useEffect(() => {
    let exChannel, payChannel;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id;
      
      if (userId) {
        setCurrentUserId(userId);
        fetchNotifications(userId);

        if (exChannel) supabase.removeChannel(exChannel);
        if (payChannel) supabase.removeChannel(payChannel);
        
        exChannel = supabase.channel(`ex-notifs-${userId}`)
          .on('postgres_changes', { 
            event: '*', schema: 'public', table: 'expenses', 
            filter: `boarder_id=eq.${userId}` 
          }, (payload) => {
            if (payload.new.notif_title) {
              fetchNotifications(userId);
              if (payload.eventType === 'INSERT' || (payload.old.notif_title !== payload.new.notif_title)) {
                showToast(payload.new.notif_message, 'warning');
              }
            }
          }).subscribe();

        payChannel = supabase.channel(`pay-notifs-${userId}`)
          .on('postgres_changes', { 
            event: '*', schema: 'public', table: 'payments', 
            filter: `boarder_id=eq.${userId}` 
          }, (payload) => {
            if (payload.new.notif_title) {
              fetchNotifications(userId);
              if (payload.eventType === 'INSERT' || (payload.old.notif_title !== payload.new.notif_title)) {
                showToast(payload.new.notif_message, 'success');
              }
            }
          }).subscribe();
      } else {
        setCurrentUserId(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (exChannel) supabase.removeChannel(exChannel);
      if (payChannel) supabase.removeChannel(payChannel);
    };
  }, [fetchNotifications, showToast]);

  return (
    <NotificationContext.Provider value={{ 
      showToast, 
      sendBrowserNotification, 
      requestPermission,
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      fetchNotifications: () => fetchNotifications(currentUserId)
    }}>
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
            {(t.type === 'info' || t.type === 'warning') && <Info size={18} color="var(--accent)" />}
            <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{t.message}</span>
            <button onClick={() => removeToast(t.id)} style={{ opacity: 0.5, marginLeft: '10px' }}><X size={16} /></button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => useContext(NotificationContext);
