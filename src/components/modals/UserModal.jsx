import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { X, Shield, Save } from 'lucide-react';

const UserModal = ({ isOpen, onClose, boarders, onSave, editingUser = null }) => {
  const { showToast } = useNotify();
  const [formData, setFormData] = useState({ name: '', role: 'Boarder', username: '', manual_debt: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingUser) setFormData({ name: editingUser.name || '', role: editingUser.role || 'Boarder', username: editingUser.username || '', manual_debt: editingUser.manual_debt || '' });
    else setFormData({ name: '', role: 'Boarder', username: '', manual_debt: '' });
  }, [editingUser, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        const debtVal = parseFloat(formData.manual_debt) || 0;
        const { error } = await supabase.from('profiles').update({ 
          name: formData.name, 
          role: formData.role,
          manual_debt: debtVal
        }).eq('id', editingUser.id);
        
        if (error) throw error;
        
        showToast(`Profile for ${formData.name} updated`, "success");
        onSave(); // Refresh data
        onClose(); // Close modal after success
      }
    } catch (err) { 
      showToast(err.message, "error"); 
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Manage Resident</h3>
          <button onClick={onClose} className="icon-btn" style={{ border: 'none', background: 'none' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="field"><label>Full Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
          <div className="field">
            <label>Role</label>
            <div className="chip-group">
              {['Boarder', 'Admin'].map(r => <button key={r} type="button" className={`chip ${formData.role === r ? 'selected' : ''}`} onClick={() => setFormData({...formData, role: r})} style={{ flex: 1 }}>{r}</button>)}
            </div>
          </div>
          <div className="field"><label>Add Starting Debt (Optional)</label><input type="number" value={formData.manual_debt} onChange={(e) => setFormData({...formData, manual_debt: e.target.value})} placeholder="0.00" /></div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={18} /> Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
