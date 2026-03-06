import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNotify } from '../../context/NotificationContext';
import { X, User, Shield, AlertCircle, Save } from 'lucide-react';

const UserModal = ({ isOpen, onClose, editingUser = null, onSave }) => {
  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const { showToast } = useNotify();
  const [formData, setFormData] = useState({ 
    name: '', role: 'Boarder', username: '', manual_debt: '0' 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setFormData({ 
        name: editingUser.name || '', 
        role: editingUser.role || 'Boarder',
        username: editingUser.username || '',
        manual_debt: (editingUser.manual_debt || 0).toString()
      });
    } else {
      setFormData({ name: '', role: 'Boarder', username: '', manual_debt: '0' });
    }
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) { showToast("Name is required", "error"); return; }

    setLoading(true);
    try {
      if (editingUser) {
        const nameChanged = formData.name !== editingUser.name;
        const currentChanges = editingUser.name_changes_count || 0;

        if (nameChanged && currentChanges >= 2) {
          throw new Error("Name change limit reached (max 2 times).");
        }

        const { error } = await supabase
          .from('profiles')
          .update({ 
            name: formData.name, 
            role: formData.role,
            manual_debt: parseFloat(formData.manual_debt || 0),
            name_changes_count: nameChanged ? currentChanges + 1 : currentChanges
          })
          .eq('id', editingUser.id);
        
        if (error) throw error;
        showToast("Boarder profile updated", "success");
      } else {
        showToast("Use invite system for new users", "info");
      }
      onSave(); onClose();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const nameChangesRemaining = 2 - (editingUser?.name_changes_count || 0);

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div className="modal-header" style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>{editingUser ? 'Edit Boarder' : 'Add Boarder'}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>Manage user access and details</p>
            </div>
            <button onClick={onClose} className="icon-btn" style={{ borderRadius: '50%' }}><X size={20} /></button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '0 32px 24px 32px' }}>
          <form id="user-form" onSubmit={handleSubmit}>
            <div className="field" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Full Name</span>
                {editingUser && (
                  <span style={{ fontSize: '10px', color: nameChangesRemaining <= 0 ? 'var(--danger)' : 'var(--accent)' }}>
                    {nameChangesRemaining} changes left
                  </span>
                )}
              </label>
              <input 
                type="text" value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Real Name" 
                disabled={editingUser && nameChangesRemaining <= 0}
                required 
              />
            </div>

            <div className="field" style={{ marginBottom: '24px' }}>
              <label>Starting Debt (Initial Balance)</label>
              <input 
                type="number" step="0.01" value={formData.manual_debt} 
                onChange={(e) => setFormData({...formData, manual_debt: e.target.value})} 
                placeholder="0.00" 
                style={{ fontWeight: '800', color: parseFloat(formData.manual_debt) > 0 ? 'var(--danger)' : 'var(--success)' }}
              />
              <p style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '6px', opacity: 0.6 }}>Legacy carry-over debt from the old system.</p>
            </div>

            <div className="field" style={{ marginBottom: '24px' }}>
              <label>Username</label>
              <input type="text" value={formData.username} disabled style={{ opacity: 0.5, background: 'rgba(0,0,0,0.1)' }} />
            </div>

            <div className="field">
              <label>Access Level</label>
              <div className="chip-group" style={{ display: 'flex', gap: '10px' }}>
                {['Boarder', 'Admin'].map(r => (
                  <button key={r} type="button" className={`chip ${formData.role === r ? 'selected' : ''}`} onClick={() => setFormData({...formData, role: r})} style={{ flex: 1, height: '44px' }}>
                    {r === 'Admin' ? <Shield size={14} style={{ marginRight: '6px' }} /> : <User size={14} style={{ marginRight: '6px' }} />}
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer" style={{ padding: '16px 32px 32px 32px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" form="user-form" className="btn btn-primary" style={{ flex: 1.5 }} disabled={loading}>
              <Save size={18} /> <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
