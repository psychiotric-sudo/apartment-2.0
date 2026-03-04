import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency, getMonthName, getDayNumber, getShortMonth } from '../../utils/formatters';
import { CheckCircle, Bell, Clock, Receipt, Wallet, ArrowUpRight, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
import { Section } from '../../components/common/DashboardUI';

const BoarderDashboard = () => {
  const { user } = useAuth();
  const { showToast, requestPermission } = useNotify();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState({});

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('my-records').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'expenses', filter: `boarder_id=eq.${user.id}` }, () => {
      fetchData();
      showToast("Data updated", "info");
    }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const toggleMonth = (month) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  const fetchData = async () => {
    try {
      const [eRes, pRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('boarder_id', user.id).order('due_date', { ascending: false }),
        supabase.from('payments').select('*').eq('boarder_id', user.id).order('date', { ascending: false })
      ]);
      
      const manualDebt = parseFloat(user.manual_debt || 0);
      const combined = [
        ...eRes.data.map(e => ({ ...e, type: 'DEBT', sortDate: e.due_date || e.created_at })),
        ...pRes.data.map(p => ({ ...p, type: 'PAYMENT', sortDate: p.date || p.created_at }))
      ];

      if (manualDebt > 0) {
        combined.push({
          id: 'manual-debt', category: 'Expense (Initial)', amount: manualDebt,
          type: 'DEBT', status: 'Unpaid', sortDate: user.manual_debt_date || user.created_at || new Date().toISOString()
        });
      }

      combined.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
      setHistory(combined);

      if (combined.length > 0) {
        const firstMonth = getMonthName(combined[0].sortDate);
        setExpandedMonths({ [firstMonth]: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const totalUnpaid = history
    .filter(item => item.type === 'DEBT' && item.status !== 'Paid')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const groupedHistory = history.reduce((acc, item) => {
    const month = getMonthName(item.sortDate);
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {});

  const sortedMonths = Object.keys(groupedHistory).sort((a, b) => {
    return new Date(groupedHistory[b][0].sortDate) - new Date(groupedHistory[a][0].sortDate);
  });

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--accent)' }}><Clock className="animate-spin" /></div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>Hi, {user.name.split(' ')[0]}! 👋</h2>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Welcome back to your residence dashboard</p>
        </div>
        <button className="icon-btn" onClick={requestPermission} style={{ background: 'var(--glass)', border: '1px solid var(--border)', width: '44px', height: '44px' }}>
          <Bell size={20} />
        </button>
      </div>

      <div className="balance-card-premium" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.7 }}>Current Balance Due</span>
            <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '8px 0', color: 'white' }}>{formatCurrency(totalUnpaid)}</h1>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> Outstanding Records
              </div>
              <div style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} /> Verified Sync
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--accent)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={28} color="white" />
          </div>
        </div>
      </div>

      <Section title="Transaction Timeline" icon={Receipt}>
        {sortedMonths.map((month) => {
          const isExpanded = expandedMonths[month];
          return (
            <div key={month} style={{ marginBottom: '12px' }}>
              <button onClick={() => toggleMonth(month)} style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s ease', marginBottom: isExpanded ? '16px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '6px', borderRadius: '6px', background: isExpanded ? 'var(--accent)' : 'rgba(255,255,255,0.05)', color: isExpanded ? 'white' : 'var(--text2)' }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: isExpanded ? 'white' : 'var(--text2)' }}>{month}</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)' }}>{groupedHistory[month].length} Records</div>
              </button>
              
              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px', borderLeft: '2px solid var(--accent)', marginLeft: '28px', paddingBottom: '24px' }}>
                  {groupedHistory[month].map((item, idx) => {
                    const isPayment = item.type === 'PAYMENT';
                    const isSettled = !isPayment && item.status === 'Paid';
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flexShrink: 0, width: '50px', height: '55px', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent)', opacity: 0.8 }}>{getShortMonth(item.sortDate)}</div>
                          <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', lineHeight: '1' }}>{getDayNumber(item.sortDate)}</div>
                        </div>
                        <div className="glass-card" style={{ flex: 1, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isPayment ? 'rgba(34, 197, 94, 0.03)' : 'rgba(255,255,255,0.01)', border: isSettled ? '1px solid rgba(255,255,255,0.05)' : '1px solid var(--border)', borderRadius: '14px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: isSettled ? 'var(--text2)' : 'white' }}>{isPayment ? `Payment via ${item.method}` : item.category}</div>
                            <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>{isPayment ? 'Successfully Received' : item.description || 'Service Debt'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: isPayment ? 'var(--success)' : isSettled ? 'var(--text2)' : 'white' }}>{isPayment ? '+' : '-'} ₱{Math.abs(parseFloat(item.amount)).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </Section>
    </div>
  );
};

export default BoarderDashboard;
