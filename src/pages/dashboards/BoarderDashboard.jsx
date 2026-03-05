import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency, getMonthName, getDayNumber, getShortMonth, formatDate, formatDateTimeWithPHT } from '../../utils/formatters';
import { CheckCircle, Bell, Clock, Receipt, Wallet, ArrowUpRight, TrendingDown, ChevronDown, ChevronRight, Crown, Smartphone } from 'lucide-react';
import { Section } from '../../components/common/DashboardUI';
import GCashPaymentModal from '../../components/modals/GCashPaymentModal';

const CategoryBadge = ({ category, type }) => {
  if (type === 'PAYMENT') return <span className="badge badge-success">Payment</span>;
  
  const catLower = (category || '').toLowerCase();
  let className = 'badge';
  if (catLower.includes('initial')) className += ' badge-initial';
  else if (catLower.includes('rent')) className += ' badge-rent';
  else if (catLower.includes('electricity')) className += ' badge-electricity';
  else if (catLower.includes('water')) className += ' badge-water';
  else if (catLower.includes('gas')) className += ' badge-gas';
  else if (catLower.includes('food') || catLower.includes('meal')) className += ' badge-food';
  
  return <span className={className}>{category}</span>;
};

const BoarderDashboard = () => {
  const { user } = useAuth();
  const { showToast, requestPermission } = useNotify();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState({});
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [rankInfo, setRankInfo] = useState({ rank: 0, color: null });
  const [isGCashModalOpen, setIsGCashModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('my-records')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `boarder_id=eq.${user.id}` }, () => {
        fetchData();
        showToast("Records updated", "info");
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `boarder_id=eq.${user.id}` }, () => {
        fetchData();
        showToast("Payment synced", "info");
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
        fetchData();
        showToast("Profile updated", "info");
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const toggleMonth = (month) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  const fetchData = async () => {
    try {
      const [eRes, pRes, profileRes, allProfilesRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('boarder_id', user.id).order('due_date', { ascending: false }),
        supabase.from('payments').select('*').eq('boarder_id', user.id).order('date', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('profiles').select('id, balance').eq('role', 'Boarder')
      ]);
      
      const latestProfile = profileRes.data || user;
      setTotalUnpaid(parseFloat(latestProfile.balance || 0));

      if (allProfilesRes.data) {
        const sorted = [...allProfilesRes.data].sort((a, b) => (parseFloat(b.balance) || 0) - (parseFloat(a.balance) || 0));
        const myIndex = sorted.findIndex(p => p.id === user.id);
        const myRank = myIndex + 1;
        const myBalance = parseFloat(latestProfile.balance || 0);

        if (myRank <= 3 && myBalance > 0) {
          const color = myRank === 1 ? '#FFD700' : myRank === 2 ? '#C0C0C0' : '#CD7F32';
          setRankInfo({ rank: myRank, color });
        } else {
          setRankInfo({ rank: 0, color: null });
        }
      }

      const manualDebt = parseFloat(latestProfile.manual_debt || 0);
      const combined = [
        ...eRes.data.map(e => ({ ...e, type: 'DEBT', sortDate: e.due_date || e.created_at })),
        ...pRes.data.map(p => ({ ...p, type: 'PAYMENT', sortDate: p.date || p.created_at }))
      ];

      if (manualDebt > 0) {
        const initialDate = latestProfile.manual_debt_date || latestProfile.created_at || new Date().toISOString();
        combined.push({
          id: 'manual-debt', 
          category: 'Initial Balance', 
          amount: manualDebt,
          description: `Initial Balance as of ${formatDate(initialDate)}`,
          type: 'DEBT', status: 'Unpaid', sortDate: initialDate
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

      <div className="balance-card-premium" style={{ marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
        {rankInfo.rank > 0 && (
          <div style={{ 
            position: 'absolute', top: '0', right: '0', 
            padding: '12px 20px', background: `${rankInfo.color}15`, 
            borderBottomLeftRadius: '24px', display: 'flex', alignItems: 'center', gap: '8px',
            border: `1px solid ${rankInfo.color}30`, borderTop: 'none', borderRight: 'none',
            backdropFilter: 'blur(4px)'
          }}>
            <Crown size={16} color={rankInfo.color} fill={rankInfo.color} style={{ filter: `drop-shadow(0 0 5px ${rankInfo.color}60)` }} />
            <span style={{ color: rankInfo.color, fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Rank #{rankInfo.rank} Highest Debt
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.7 }}>Current Balance Due</span>
            <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '8px 0', color: 'white' }}>{formatCurrency(totalUnpaid)}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> Outstanding Records
              </div>
              <button 
                onClick={() => setIsGCashModalOpen(true)}
                style={{ 
                  padding: '6px 14px', 
                  borderRadius: '10px', 
                  fontSize: '12px', 
                  fontWeight: '700',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  background: 'transparent',
                  border: '1px solid #007dfe',
                  color: '#007dfe',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 125, 254, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Smartphone size={14} /> GCash Pay
              </button>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <CategoryBadge category={item.category || 'Payment'} type={item.type} />
                              {isSettled && <span className="badge badge-success">Settled</span>}
                            </div>
                            <div style={{ fontSize: '11px', opacity: 0.5, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span>{isPayment ? `Received via ${item.method}` : item.description || 'Service Debt'}</span>
                              <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--accent)' }}>{formatDateTimeWithPHT(item.sortDate)}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: isPayment ? 'var(--success)' : isSettled ? 'var(--text2)' : 'white' }}>{isPayment ? '-' : '+'} ₱{Math.abs(parseFloat(item.amount)).toLocaleString()}</div>
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

      <GCashPaymentModal 
        isOpen={isGCashModalOpen} 
        onClose={() => setIsGCashModalOpen(false)} 
      />
    </div>
  );
};

export default BoarderDashboard;
