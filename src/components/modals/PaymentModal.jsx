import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNotify } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/formatters';
import { roundAmount, ROUNDING_MODES } from '../../utils/rounding';
import { X, CreditCard, User, Calendar, Save, Tag, Landmark, Coins } from 'lucide-react';

const CATEGORIES = ['Rent', 'Electricity', 'Water', 'Gas', 'Meals/Food', 'Other'];

const PaymentModal = ({ isOpen, onClose, boarders, expenses, onSave, editingPayment = null }) => {
  const { showToast } = useNotify();
  const [formData, setFormData] = useState({ 
    boarder_id: '', expense_id: '', amount: '', method: 'Cash',
    category: '', date: new Date().toLocaleDateString('sv') // YYYY-MM-DD format
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  useEffect(() => { 
    if (editingPayment) {
      setFormData({
        boarder_id: editingPayment.boarder_id, expense_id: editingPayment.expense_id || '',
        amount: editingPayment.amount.toString(), method: editingPayment.method || 'Cash',
        category: editingPayment.category || '',
        date: new Date(editingPayment.date || editingPayment.created_at).toISOString().split('T')[0]
      });
    } else {
      setFormData({ 
        boarder_id: '', expense_id: '', amount: '', method: 'Cash',
        category: '', date: new Date().toLocaleDateString('sv')
      });
    }
  }, [editingPayment, isOpen]);

  if (!isOpen) return null;

  const handleAmountChange = (val) => {
    if (val.length > 10) return;
    setFormData({ ...formData, amount: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.boarder_id || !formData.amount) { showToast("Missing fields", "error"); return; }
    if (!formData.category) { showToast("Please select a category for this payment", "error"); return; }
    setLoading(true);
    const resident = boarders.find(b => b.id === formData.boarder_id);
    try {
      if (editingPayment) {
        const { error } = await supabase.from('payments').update({
          amount: parseFloat(formData.amount), method: formData.method,
          date: formData.date, expense_id: formData.expense_id || null,
          category: formData.category || null
        }).eq('id', editingPayment.id);
        if (error) throw error;
        showToast(`Payment updated`, "success");
      } else {
        const { error } = await supabase.rpc('record_payment_v3', { 
          p_boarder_id: formData.boarder_id, p_amount: parseFloat(formData.amount), 
          p_method: formData.method, p_expense_id: formData.expense_id || null,
          p_date: formData.date, p_category: formData.category || null
        });
        if (error) throw error;
        showToast(`Payment recorded`, "success");
      }
      onSave(); onClose();
    } catch (err) { showToast(err.message, "error"); } finally { setLoading(false); }
  };

  const filteredExpenses = expenses.filter(e => e.boarder_id === formData.boarder_id && (editingPayment ? true : e.status !== 'Paid'));

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header" style={{ padding: '20px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '950', color: 'white' }}>{editingPayment ? 'EDIT LEDGER' : 'RECORD PAYMENT'}</h3>
            <button onClick={onClose} className="icon-btn" style={{ width: '36px', height: '36px' }}><X size={18} /></button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '20px 32px' }}>
          <form id="payment-form" onSubmit={handleSubmit}>
            {/* 1. BOARDER SELECTION (MOVED TO TOP) */}
            <div className="field" style={{ marginBottom: '24px' }}>
              <label>WHOS PAYING? (BOARDER ORIGIN)</label>
              {!editingPayment ? (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '16px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '8px' }}>
                  {boarders.map(b => (
                    <button key={b.id} type="button" className={`chip-success chip ${formData.boarder_id === b.id ? 'selected' : ''}`} onClick={() => setFormData({...formData, boarder_id: b.id, expense_id: ''})} style={{ height: '38px', fontSize: '11px' }}>{b.name.split(' ')[0]}</button>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--success)', borderRadius: '12px', fontWeight: '800', color: 'white', textAlign: 'center' }}>
                  {boarders.find(b => b.id === formData.boarder_id)?.name || 'UNKNOWN'}
                </div>
              )}
            </div>

            {/* 2. AMOUNT */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'var(--success)', fontSize: '11px', fontWeight: '900', letterSpacing: '0.1em' }}>VALUE PAID (₱)</label>
              <div style={{ position: 'relative', marginTop: '8px' }}>
                <input 
                  type="number" step="0.01" value={formData.amount} 
                  onChange={(e) => handleAmountChange(e.target.value)} 
                  placeholder="0.00" required 
                  style={{ height: '64px', fontSize: '32px', fontWeight: '950', textAlign: 'center', background: '#000', border: '2px solid var(--success)', borderRadius: '16px', color: 'white' }}
                />
              </div>
            </div>

            {/* 3. CATEGORY */}
            <div className="field" style={{ marginBottom: '20px' }}>
              <label>CATEGORY SOURCE</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" className={`chip-success chip ${formData.category === cat ? 'selected' : ''}`} onClick={() => setFormData({...formData, category: formData.category === cat ? '' : cat})} style={{ height: '34px', fontSize: '11px', padding: '0' }}>{cat}</button>
                ))}
              </div>
            </div>

            {/* 4. DATE */}
            <div className="field" style={{ marginBottom: '20px' }}>
              <label>EFFECTIVE DATE</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required style={{ height: '48px', fontSize: '15px' }} />
            </div>

            {/* 5. METHOD */}
            <div className="field" style={{ marginTop: '24px' }}>
              <label>PAYMENT CHANNEL</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Cash', 'GCash'].map(m => (
                  <button key={m} type="button" className={`chip-success chip ${formData.method === m ? 'selected' : ''}`} onClick={() => setFormData({...formData, method: m})} style={{ flex: 1, height: '44px', fontSize: '14px' }}>{m}</button>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer" style={{ padding: '16px 32px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: '56px' }}>CANCEL</button>
            <button type="submit" form="payment-form" className="btn btn-success" style={{ flex: 1.5, height: '56px' }} disabled={loading}>
              <Save size={18} /> <span>{editingPayment ? 'SAVE' : 'CONFIRM'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
