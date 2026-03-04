import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, onClose, onConfirm, title = "Are you sure?", message = "This action cannot be undone.",
  confirmText = "Proceed", strict = false, danger = false
}) => {
  const [inputValue, setInputValue] = useState('');
  useEffect(() => { if (isOpen) setInputValue(''); }, [isOpen]);
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (strict && inputValue !== 'CONFIRM') return;
    onConfirm();
    onClose();
  };

  const isLocked = strict && inputValue !== 'CONFIRM';

  return (
    <div className={`modal-overlay active`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '400px', padding: '32px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: danger ? 'rgba(244, 63, 94, 0.1)' : 'rgba(108, 140, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: danger ? 'var(--danger)' : 'var(--accent)' }}>
          {danger ? <ShieldAlert size={32} /> : <AlertTriangle size={32} />}
        </div>
        <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '12px', color: 'white' }}>{title}</h3>
        <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>{message}</p>
        {strict && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--danger)' }}>Type CONFIRM to proceed</label>
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="CONFIRM" style={{ textAlign: 'center', letterSpacing: '2px', fontWeight: '800', borderColor: inputValue === 'CONFIRM' ? 'var(--success)' : 'var(--border)' }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={handleConfirm} disabled={isLocked} style={{ flex: 1, opacity: isLocked ? 0.5 : 1 }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
