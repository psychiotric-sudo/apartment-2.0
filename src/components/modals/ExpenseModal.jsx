import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNotify } from '../../context/NotificationContext';
import { roundAmount, ROUNDING_MODES } from '../../utils/rounding';
import { formatCurrency } from '../../utils/formatters';
import { X, Save, Receipt, Users, Calendar, ArrowRight, Activity, Percent } from 'lucide-react';

const CATEGORIES = ['Meals/Food', 'Rent', 'Electricity', 'Water', 'Gas'];

const ExpenseModal = ({ isOpen, onClose, boarders, onSave, editingExpense = null }) => {
  const { showToast } = useNotify();
  const [formData, setFormData] = useState({
    category: 'Meals/Food', amount: '0', description: '',
    due_date: new Date().toISOString().split('T')[0],
    participants: [], rounding: ROUNDING_MODES.UP_5
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        category: editingExpense.category, amount: editingExpense.amount.toString(),
        description: editingExpense.description || '', due_date: editingExpense.due_date,
        participants: [editingExpense.boarder_id], 
        rounding: editingExpense.rounding || ROUNDING_MODES.UP_5
      });
    } else {
      setFormData({
        category: 'Meals/Food', amount: '0', description: '',
        due_date: new Date().toISOString().split('T')[0],
        participants: boarders.map(b => b.id), rounding: ROUNDING_MODES.UP_5
      });
    }
  }, [editingExpense, isOpen, boarders]);

  if (!isOpen) return null;

  const handleAmountChange = (val) => {
    if (val.length > 10) return;
    setFormData({ ...formData, amount: val });
  };

  const toggleParticipant = (id) => {
    if (editingExpense) return;
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(id) ? prev.participants.filter(pid => pid !== id) : [...prev.participants, id]
    }));
  };

  const perPerson = !editingExpense && formData.participants.length > 0 
    ? roundAmount(parseFloat(formData.amount || 0) / (formData.category === 'Rent' ? 1 : formData.participants.length), formData.rounding)
    : parseFloat(formData.amount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.participants.length === 0) { showToast("Select participants", "error"); return; }
    setLoading(true);
    try {
      if (editingExpense) {
        const { error } = await supabase.from('expenses').update({ 
          category: formData.category, amount: parseFloat(formData.amount), 
          description: formData.description, due_date: formData.due_date 
        }).eq('id', editingExpense.id);
        if (error) throw error;
        showToast(`Debt updated`, "success");
      } else {
        const records = formData.participants.map(pid => ({ 
          boarder_id: pid, category: formData.category, amount: perPerson, 
          description: formData.description || `Split ${formData.category}`, 
          due_date: formData.due_date, status: 'Pending' 
        }));
        const { error } = await supabase.from('expenses').insert(records);
        if (error) throw error;
        showToast(`${formData.category} recorded`, "success");
      }
      onSave(); onClose();
    } catch (err) { showToast(err.message, "error"); } finally { setLoading(false); }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: '950', color: 'white', letterSpacing: '-1px' }}>{editingExpense ? 'EDIT LEDGER' : 'GENERATE DEBT'}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: '600' }}>PRECISION BILLING INTERFACE</p>
            </div>
            <button onClick={onClose} className="icon-btn" style={{ borderRadius: '50%', width: '40px', height: '40px' }}><X size={20} /></button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '24px 32px' }}>
          <form id="expense-form" onSubmit={handleSubmit}>
            {/* 1. AMOUNT (THE CORE) */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '0.15em' }}>TOTAL QUANTUM VALUE (₱)</label>
              <div style={{ position: 'relative', marginTop: '10px' }}>
                <input 
                  type="number" step="0.01" value={formData.amount} 
                  onChange={(e) => handleAmountChange(e.target.value)} 
                  placeholder="0.00" required 
                  style={{ height: '72px', fontSize: '42px', fontWeight: '950', textAlign: 'center', background: '#000', border: '2px solid var(--accent)', borderRadius: '18px', color: 'white', boxShadow: '0 0 25px var(--accent-glow)' }}
                />
              </div>
              {!editingExpense && formData.category !== 'Rent' && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
                  <button type="button" className={`chip ${formData.rounding === ROUNDING_MODES.UP_1 ? 'selected' : ''}`} onClick={() => setFormData({...formData, rounding: ROUNDING_MODES.UP_1})} style={{ fontSize: '11px', height: '34px', padding: '0 16px' }}>ROUND ₱1</button>
                  <button type="button" className={`chip ${formData.rounding === ROUNDING_MODES.UP_5 ? 'selected' : ''}`} onClick={() => setFormData({...formData, rounding: ROUNDING_MODES.UP_5})} style={{ fontSize: '11px', height: '34px', padding: '0 16px' }}>ROUND ₱5/10</button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: '10px', display: 'block' }}>SELECT CATEGORY</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '8px' }}>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat} type="button" 
                    className={`chip ${formData.category === cat ? 'selected' : ''}`} 
                    onClick={() => setFormData({...formData, category: cat})}
                    style={{ height: '42px', fontSize: '11px', fontWeight: '800' }}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="field" style={{ marginBottom: '24px' }}>
              <label>DUE DATE</label>
              <input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} required style={{ height: '52px', fontWeight: '800' }} />
            </div>

            {/* 4. PARTICIPANTS */}
            <div className="field">
              <label>TARGET ENTITIES ({formData.participants.length})</label>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '16px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '8px' }}>
                {boarders.map(b => (
                  <button key={b.id} type="button" className={`chip ${formData.participants.includes(b.id) ? 'selected' : ''}`} onClick={() => toggleParticipant(b.id)} disabled={editingExpense} style={{ height: '38px', fontSize: '11px' }}>{b.name.split(' ')[0]}</button>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer" style={{ padding: '24px 32px' }}>
          {!editingExpense && (
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, #000 100%)', 
              border: '1px solid var(--accent)', 
              borderRadius: '24px', 
              padding: '24px', 
              marginBottom: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 30px rgba(99, 102, 241, 0.1)'
            }}>
              {/* Technical Decorative Elements */}
              <div style={{ position: 'absolute', top: '0', right: '0', width: '60px', height: '60px', background: 'var(--accent)', opacity: 0.05, borderRadius: '0 0 0 100%' }}></div>
              <div style={{ position: 'absolute', bottom: '12px', right: '24px', opacity: 0.1 }}><Activity size={40} color="var(--accent)" /></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Percent size={12} color="var(--accent)" />
                    <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '0.2em' }}>CALCULATED SHARE</span>
                  </div>
                  <div style={{ fontSize: '42px', fontWeight: '950', color: 'white', lineHeight: '1', letterSpacing: '-1px' }}>
                    {formatCurrency(perPerson)}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right', zIndex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text2)', marginBottom: '4px' }}>
                    {formatCurrency(parseFloat(formData.amount || 0))} ÷ {formData.participants.length}
                  </div>
                  <div style={{ fontSize: '9px', fontWeight: '900', color: 'white', background: 'var(--accent)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block', boxShadow: '0 4px 10px var(--accent-glow)' }}>
                    FINAL PER HEAD
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: '56px' }}>CANCEL</button>
            <button type="submit" form="expense-form" className="btn btn-primary" style={{ flex: 1.5, height: '56px', fontSize: '16px' }} disabled={loading}>
              <Save size={20} /> <span>EXECUTE POST</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
