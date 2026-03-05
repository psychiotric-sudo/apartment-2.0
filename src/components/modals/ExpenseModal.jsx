import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNotify } from '../../context/NotificationContext';
import { roundAmount, ROUNDING_MODES } from '../../utils/rounding';
import { formatCurrency } from '../../utils/formatters';
import { X, Save, Coins } from 'lucide-react';

const CATEGORIES = ['Meals/Food', 'Rent', 'Electricity', 'Water', 'Gas'];

const ExpenseModal = ({ isOpen, onClose, boarders, onSave, editingExpense = null }) => {
  const { showToast } = useNotify();
  const [formData, setFormData] = useState({
    category: 'Rent', amount: '1500', description: '',
    due_date: new Date().toISOString().split('T')[0],
    participants: [], rounding: ROUNDING_MODES.UP_1
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        category: editingExpense.category, amount: editingExpense.amount,
        description: editingExpense.description || '', due_date: editingExpense.due_date,
        participants: editingExpense.participants || [], rounding: editingExpense.rounding || ROUNDING_MODES.UP_1
      });
    } else {
      setFormData({
        category: 'Rent', amount: '1500', description: '',
        due_date: new Date().toISOString().split('T')[0],
        participants: boarders.map(b => b.id), rounding: ROUNDING_MODES.UP_1
      });
    }
  }, [editingExpense, isOpen, boarders]);

  const toggleParticipant = (id) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(id) ? prev.participants.filter(pid => pid !== id) : [...prev.participants, id]
    }));
  };

  const getSplitValue = () => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0 || formData.participants.length === 0) return 0;
    if (formData.category === 'Rent') return amount;
    return roundAmount(amount / formData.participants.length, formData.rounding);
  };

  const perPerson = getSplitValue();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.participants.length === 0) { showToast("Select participants", "error"); return; }
    
    setLoading(true);
    try {
      if (editingExpense) {
        const { error } = await supabase.from('expenses')
          .update({ 
            category: formData.category, 
            amount: parseFloat(formData.amount), 
            description: formData.description, 
            due_date: formData.due_date 
          })
          .eq('id', editingExpense.id);
        if (error) throw error;
      } else {
        const records = formData.participants.map(pid => ({ 
          boarder_id: pid, 
          category: formData.category, 
          amount: perPerson, 
          description: formData.description || `Split ${formData.category}`, 
          due_date: formData.due_date, 
          status: 'Pending' 
        }));
        const { error } = await supabase.from('expenses').insert(records);
        if (error) throw error;
      }
      
      showToast(`${formData.category} recorded`, "success");
      onSave(); // Refresh data
      onClose(); // Close modal after success
    } catch (err) { 
      showToast(err.message, "error"); 
    } finally {
      setLoading(false);
    }
  };

  const getCategoryClass = (cat) => {
    const catLower = cat.toLowerCase();
    if (catLower.includes('rent')) return 'badge-rent';
    if (catLower.includes('electricity')) return 'badge-electricity';
    if (catLower.includes('water')) return 'badge-water';
    if (catLower.includes('gas')) return 'badge-gas';
    if (catLower.includes('food') || catLower.includes('meal')) return 'badge-food';
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '460px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{editingExpense ? 'Edit Debt' : 'Add New Debt'}</h3>
          <button onClick={onClose} className="icon-btn" style={{ border: 'none', background: 'none' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <label style={{ fontSize: '12px', marginBottom: '6px' }}>Category</label>
            <div className="chip-group">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat} type="button" 
                  className={`chip ${formData.category === cat ? 'selected ' + getCategoryClass(cat) : ''}`} 
                  onClick={() => setFormData({...formData, category: cat})}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="field">
              <label style={{ fontSize: '12px', marginBottom: '6px' }}>{formData.category === 'Rent' ? 'Rent' : 'Total'}</label>
              <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required />
            </div>
            <div className="field">
              <label style={{ fontSize: '12px', marginBottom: '6px' }}>Due Date</label>
              <input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} required />
            </div>
          </div>
          {formData.category !== 'Rent' && (
            <div className="field">
              <label style={{ fontSize: '12px', marginBottom: '6px' }}><Coins size={12} /> Rounding</label>
              <div className="chip-group">
                <button type="button" className={`chip ${formData.rounding === ROUNDING_MODES.UP_1 ? 'selected' : ''}`} onClick={() => setFormData({...formData, rounding: ROUNDING_MODES.UP_1})} style={{ flex: 1 }}>UP to ₱1</button>
                <button type="button" className={`chip ${formData.rounding === ROUNDING_MODES.UP_5 ? 'selected' : ''}`} onClick={() => setFormData({...formData, rounding: ROUNDING_MODES.UP_5})} style={{ flex: 1 }}>UP to ₱5/10</button>
              </div>
            </div>
          )}
          <div className="field">
            <label style={{ fontSize: '12px', marginBottom: '6px' }}>Participants ({formData.participants.length})</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px', maxHeight: '160px', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px' }}>
              {boarders.map(b => (
                <button key={b.id} type="button" className={`chip ${formData.participants.includes(b.id) ? 'selected' : ''}`} onClick={() => toggleParticipant(b.id)} style={{ width: '100%' }}>{b.name}</button>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase' }}>Per Person</div><div style={{ fontSize: '20px', fontWeight: '800' }}>{formatCurrency(perPerson)}</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '12px', fontWeight: '600' }}>{formData.participants.length} Split</div></div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}><Save size={16} /> Record Debt</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
