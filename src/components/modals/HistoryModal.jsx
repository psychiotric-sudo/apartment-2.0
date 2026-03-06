import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Calendar, ArrowUpCircle, ArrowDownCircle, RefreshCw, Clock, CheckCircle2, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { formatCurrency, formatDate, getMonthName, formatDateTimeWithPHT } from '../../utils/formatters';

const HistoryModal = ({ isOpen, onClose, user }) => {
  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState({});

  useEffect(() => {
    if (isOpen && user) fetchUserHistory();
  }, [isOpen, user]);

  const toggleMonth = (month) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  const fetchUserHistory = async () => {
    setLoading(true);
    try {
      const [eRes, pRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('boarder_id', user.id).order('due_date', { ascending: true }),
        supabase.from('payments').select('*').eq('boarder_id', user.id).order('date', { ascending: true })
      ]);

      const manualDebt = parseFloat(user.manual_debt || 0);
      let combined = [
        ...(eRes.data || []).map(e => ({ 
          id: `e-${e.id}`, 
          date: e.due_date || e.created_at, 
          type: "DEBT", 
          category: e.category,
          description: e.description || e.category, 
          amount: parseFloat(e.amount), 
          status: e.status 
        })),
        ...(pRes.data || []).map(p => ({ 
          id: `p-${p.id}`, 
          date: p.date || p.created_at, 
          type: "PAYMENT", 
          category: "Payment",
          description: `Payment via ${p.method || 'Unknown'}`, 
          amount: parseFloat(p.amount), 
          method: p.method || "Unknown"
        }))
      ];

      if (manualDebt > 0) {
        const initialDate = user.manual_debt_date || user.created_at;
        combined.push({ 
          id: 'manual-debt', 
          date: initialDate, 
          type: "DEBT", 
          category: "Initial Balance",
          description: `Initial Balance as of ${formatDate(initialDate)}`, 
          amount: manualDebt, 
          status: "Unpaid" 
        });
      }

      // Sort chronologically for running balance
      combined.sort((a, b) => new Date(a.date) - new Date(b.date));

      let runningBalance = 0;
      const historyWithBalance = combined.map(item => {
        if (item.type === "DEBT") runningBalance += item.amount;
        else runningBalance -= item.amount;
        return { ...item, runningBalance };
      });

      // Group by Month Year
      const grouped = historyWithBalance.reverse().reduce((acc, item) => {
        const date = new Date(item.date);
        const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(item);
        return acc;
      }, {});

      setHistory(grouped);
      
      // Expand first month by default
      const firstMonth = Object.keys(grouped)[0];
      if (firstMonth) setExpandedMonths({ [firstMonth]: true });

    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className={`modal-overlay active`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '850px', width: '95%', padding: '0', overflow: 'hidden', borderRadius: '20px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
        
        {/* Simplified Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'white' }}>Transaction History: {user.name}</h2>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '2px' }}>Detailed chronological records grouped by month</p>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}><X size={18} /></button>
        </div>

        {/* Scrollable Content */}
        <div style={{ maxHeight: '75vh', overflowY: 'auto', padding: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--accent)' }}>
              <RefreshCw className="animate-spin" size={28} />
              <p style={{ marginTop: '12px', fontSize: '14px' }}>Loading records...</p>
            </div>
          ) : Object.keys(history).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>
              <Info size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
              <p>No transactions found for this resident.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.keys(history).map((month) => {
                const isExpanded = expandedMonths[month];
                return (
                  <div key={month} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                    {/* Month Dropdown Header */}
                    <button 
                      onClick={() => toggleMonth(month)}
                      style={{ 
                        width: '100%', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', 
                        alignItems: 'center', background: isExpanded ? 'rgba(108, 140, 255, 0.08)' : 'transparent',
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ color: isExpanded ? 'var(--accent)' : 'var(--text2)' }}>
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>
                        <span style={{ fontWeight: '800', color: isExpanded ? 'white' : 'var(--text2)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {month}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text2)', opacity: 0.6 }}>
                        {history[month].length} TRANSACTIONS
                      </span>
                    </button>

                    {/* Collapsible Content */}
                    {isExpanded && (
                      <div style={{ padding: '0 12px 12px 12px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', fontWeight: '700' }}>Date</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', fontWeight: '700' }}>Detail</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', fontWeight: '700' }}>Amount</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', fontWeight: '700' }}>Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {history[month].map((item, idx) => {
                                const isDebt = item.type === "DEBT";
                                return (
                                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: 'white', whiteSpace: 'nowrap' }}>
                                      {formatDateTimeWithPHT(item.date)}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ color: isDebt ? 'var(--danger)' : 'var(--success)', opacity: 0.8 }}>
                                          {isDebt ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                                        </div>
                                        <div>
                                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{item.description}</div>
                                          <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '2px' }}>
                                            {isDebt ? item.status : item.method} • {item.category}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '800', color: isDebt ? 'white' : 'var(--success)' }}>
                                      {isDebt ? '-' : '+'}₱{Math.abs(item.amount).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '800', color: 'white', opacity: 0.9 }}>
                                      ₱{item.runningBalance.toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                              {/* Monthly Snapshot Footer */}
                              <tr>
                                <td colSpan="3" style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                  Balance as of end of {month.split(' ')[0]}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '900', color: 'var(--accent)', background: 'rgba(108, 140, 255, 0.05)' }}>
                                  ₱{history[month][0].runningBalance.toLocaleString()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.1)' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '8px 20px', fontSize: '13px' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
