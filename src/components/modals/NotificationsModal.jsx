import React, { useEffect } from 'react';
import { X, Bell, CheckCircle2, Clock, Trash2, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNotify } from '../../context/NotificationContext';
import { formatDateTimeWithPHT } from '../../utils/formatters';

const NotificationsModal = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotify();

  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} color="var(--success)" />;
      case 'error': return <AlertTriangle size={18} color="var(--danger)" />;
      case 'warning': return <Info size={18} color="var(--warning)" />;
      default: return <Bell size={18} color="var(--accent)" />;
    }
  };

  return (
    <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '500px', width: '95%', padding: '0', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Bell size={20} color="var(--accent)" />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', fontSize: '10px', fontWeight: '900', padding: '2px 5px', borderRadius: '10px', border: '2px solid var(--surface)' }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Notifications</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: '4px 8px' }}>
                Mark all as read
              </button>
            )}
            <button onClick={onClose} className="icon-btn" style={{ width: '32px', height: '32px' }}><X size={18} /></button>
          </div>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '12px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
              <Bell size={40} style={{ opacity: 0.1, marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', fontWeight: '600' }}>No notifications yet</p>
              <p style={{ fontSize: '12px', opacity: 0.6 }}>Important updates about your stay will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.is_read && markAsRead(notif.id, notif.table)}
                  style={{ 
                    padding: '16px', borderRadius: '14px', background: notif.is_read ? 'transparent' : 'rgba(108, 140, 255, 0.05)', 
                    border: '1px solid', borderColor: notif.is_read ? 'var(--border)' : 'rgba(108, 140, 255, 0.2)',
                    display: 'flex', gap: '16px', cursor: notif.is_read ? 'default' : 'pointer',
                    transition: 'all 0.2s ease', position: 'relative'
                  }}
                >
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>{getTypeIcon(notif.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: notif.is_read ? 'var(--text2)' : 'white', margin: 0 }}>{notif.notif_title}</h4>
                      {!notif.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></div>}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text2)', margin: '0 0 8px 0', lineHeight: '1.4' }}>{notif.notif_message}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '700', color: 'var(--text2)', opacity: 0.5 }}>
                      <Clock size={10} />
                      {formatDateTimeWithPHT(notif.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', textAlign: 'center', background: 'rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text2)', margin: 0 }}>Recent activity feed</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
