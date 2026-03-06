import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar, Receipt, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNotify } from '../../context/NotificationContext';
import { formatDateTimeWithPHT } from '../../utils/formatters';

const NewActivityModal = ({ isOpen, onClose, notifications }) => {
  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen || !notifications || notifications.length === 0) return null;

  const { markAllAsRead } = useNotify();

  const handleClose = () => {
    markAllAsRead();
    onClose();
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 10000 }} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal" style={{ maxWidth: '450px', width: '95%', padding: '0', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--accent)', boxShadow: '0 0 40px rgba(59, 130, 246, 0.2)' }}>
        <div style={{ padding: '32px 24px 20px 24px', textAlign: 'center', background: 'var(--surface)' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--accent-gradient)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 20px var(--accent-glow)' }}>
            <Bell size={32} color="white" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 8px 0', color: 'white' }}>New Activity!</h2>
          <p style={{ color: 'var(--text2)', fontSize: '14px', margin: 0 }}>You have {notifications.length} new update{notifications.length > 1 ? 's' : ''} since your last visit.</p>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '40vh', overflowY: 'auto' }}>
          {notifications.map((notif) => (
            <div key={`${notif.table}-${notif.id}`} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', gap: '14px' }}>
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {notif.table === 'expenses' ? <Receipt size={20} color="var(--danger)" /> : <CreditCard size={20} color="var(--success)" />}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{notif.notif_title}</div>
                <p style={{ fontSize: '13px', color: 'var(--text2)', margin: '0 0 8px 0', lineHeight: '1.4' }}>{notif.notif_message}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '700', color: 'var(--accent)', opacity: 0.8 }}>
                  <Calendar size={10} />
                  {formatDateTimeWithPHT(notif.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '24px', background: 'rgba(0,0,0,0.1)' }}>
          <button 
            onClick={handleClose}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            <CheckCircle2 size={18} />
            <span>Understood, Thanks!</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewActivityModal;
