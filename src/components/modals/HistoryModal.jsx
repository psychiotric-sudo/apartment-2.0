import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Calendar, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';

const HistoryModal = ({ isOpen, onClose, user }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) fetchUserHistory();
  }, [isOpen, user]);

  const fetchUserHistory = async () => {
    setLoading(true);
    try {
      const [eRes, pRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('boarder_id', user.id).order('due_date', { ascending: false }),
        supabase.from('payments').select('*').eq('boarder_id', user.id).order('date', { ascending: false })
      ]);

      const manualDebt = parseFloat(user.manual_debt || 0);
      const combined = [
        ...(eRes.data || []).map(e => ({ id: `e-${e.id}`, date: e.due_date || e.created_at, type: "Expense", description: e.description || e.category, amount: -parseFloat(e.amount), method: "N/A", status: e.status })),
        ...(pRes.data || []).map(p => ({ id: `p-${p.id}`, date: p.date || p.created_at, type: "Payment", description: `Payment recorded`, amount: parseFloat(p.amount), method: p.method || "Unknown", status: "Success" }))
      ];

      if (manualDebt > 0) {
        combined.push({ id: 'manual-debt', date: user.manual_debt_date || user.created_at, type: "Initial", description: "Expense (Initial)", amount: -manualDebt, method: "N/A", status: "Unpaid" });
      }

      combined.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(combined);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (!isOpen || !user) return null;

  const grouped = history.reduce((acc, item) => {
    const monthKey = new Date(item.date).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(item);
    return acc;
  }, {});

  const months = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '800px', padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'white' }}>Personal History - {user.name}</h2>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '4px' }}>Detailed records for your reference</p>
          </div>
          <button onClick={onClose} className="icon-btn"><X size={20} /></button>
        </div>

        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
          {loading ? <div style={{ textAlign: 'center', padding: '100px' }}><RefreshCw className="animate-spin" /></div> : months.map(month => (
            <div key={month} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                <Calendar size={16} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{month}</h3>
              </div>
              <div className="table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--glass-light)' }}>
                      <th style={{ padding: '12px 20px', fontSize: '11px', width: '120px' }}>Date</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px' }}>Details</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[month].map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px 20px' }}>{new Date(item.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {item.amount > 0 ? <ArrowUpCircle size={18} style={{ color: 'var(--success)' }} /> : <ArrowDownCircle size={18} style={{ color: 'var(--danger)' }} />}
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.description}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{item.type} • {item.method}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '800', color: item.amount > 0 ? 'var(--success)' : 'white' }}>
                          {item.amount > 0 ? '+' : '-'} ₱{Math.abs(item.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close Records</button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
