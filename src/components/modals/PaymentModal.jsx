import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNotify } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/formatters';
import { X, CreditCard, User } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, boarders, expenses, onSave }) => {
  const { showToast } = useNotify();
  const [formData, setFormData] = useState({ boarder_id: '', expense_id: '', amount: '', method: 'Cash' });

  useEffect(() => { if (!isOpen) setFormData({ boarder_id: '', expense_id: '', amount: '', method: 'Cash' }); }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.boarder_id || !formData.amount) { showToast("Missing fields", "error"); return; }
    const resident = boarders.find(b => b.id === formData.boarder_id);
    onClose();
    onSave(); 
    try {
      const { error } = await supabase.rpc('record_payment_v2', { p_boarder_id: formData.boarder_id, p_amount: parseFloat(formData.amount), p_method: formData.method, p_expense_id: formData.expense_id || null });
      if (error) throw error;
      showToast(`Payment for ${resident?.name} synced`, "success");
    } catch (err) { showToast(err.message, "error"); onSave(); }
  };

  const filteredExpenses = expenses.filter(e => e.boarder_id === formData.boarder_id && e.status !== 'Paid');

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Record Payment</h3>
          <button onClick={onClose} className="icon-btn" style={{ border: 'none', background: 'none' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Who is paying?</label>
            <div className="chip-group" style={{ background: 'var(--glass-light)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', maxHeight: '160px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
              {boarders.map(b => (
                <button key={b.id} type="button" className={`chip ${formData.boarder_id === b.id ? 'selected' : ''}`} onClick={() => setFormData({...formData, boarder_id: b.id, expense_id: ''})} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}><User size={12} />{b.name}</button>
              ))}
            </div>
          </div>
          {formData.boarder_id && (
            <div className="field">
              <label>Link to specific debt (Optional)</label>
              <select value={formData.expense_id} onChange={(e) => { const exp = filteredExpenses.find(ex => ex.id === e.target.value); setFormData({ ...formData, expense_id: e.target.value, amount: exp ? exp.amount : formData.amount }); }}>
                <option value="">-- General Payment --</option>
                {filteredExpenses.map(e => <option key={e.id} value={e.id}>{e.category} - {formatCurrency(e.amount)}</option>)}
              </select>
            </div>
          )}
          <div className="field"><label>Amount Received (₱)</label><input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required /></div>
          <div className="field">
            <label>Method</label>
            <div className="chip-group" style={{ display: 'flex', gap: '10px' }}>
              {['Cash', 'GCash'].map(m => <button key={m} type="button" className={`chip ${formData.method === m ? 'selected' : ''}`} onClick={() => setFormData({...formData, method: m})} style={{ flex: 1 }}>{m}</button>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><CreditCard size={18} /> Confirm Instantly</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
