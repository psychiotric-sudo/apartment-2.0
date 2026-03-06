import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency, getMonthName, getDayNumber, getShortMonth, formatDate, formatDateTimeWithPHT } from '../../utils/formatters';
import { 
  CheckCircle, Bell, Clock, Receipt, Wallet, 
  ArrowUpRight, TrendingDown, ChevronDown, ChevronRight, 
  Crown, Smartphone, AlertCircle, CalendarDays 
} from 'lucide-react';
import { Section } from '../../components/common/DashboardUI';
import GCashPaymentModal from '../../components/modals/GCashPaymentModal';
import { CardSkeleton, TableSkeleton } from '../../components/common/Skeleton';

const CategoryBadge = ({ category, type }) => {
  const catLower = (category || '').toLowerCase();
  let className = 'badge';
  
  if (catLower.includes('initial')) className += ' badge-initial';
  else if (catLower.includes('rent')) className += ' badge-rent';
  else if (catLower.includes('electricity')) className += ' badge-electricity';
  else if (catLower.includes('water')) className += ' badge-water';
  else if (catLower.includes('gas')) className += ' badge-gas';
  else if (catLower.includes('food') || catLower.includes('meal')) className += ' badge-food';
  else if (type === 'PAYMENT') className += ' badge-success';
  
  return <span className={className}>{category || 'Payment'}</span>;
};

const BoarderDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotify();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState({});
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [rankInfo, setRankInfo] = useState({ rank: 0, color: null });
  const [isGCashModalOpen, setIsGCashModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('my-records')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `boarder_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `boarder_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user.id]);

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
          description: `Starting Balance (${formatDate(initialDate)})`,
          type: 'DEBT', status: 'Unpaid', sortDate: initialDate
        });
      }

      combined.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
      setHistory(combined);

      if (combined.length > 0) {
        const firstMonth = getMonthName(combined[0].sortDate);
        setExpandedMonths({ [firstMonth]: true });
      }
    } catch (err) {
      console.error("Data fetch error:", err);
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

  if (loading) return (
    <div className="fade-in" style={{ padding: '0px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div className="skeleton" style={{ width: '180px', height: '28px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '250px', height: '14px' }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: '240px', borderRadius: '24px', marginBottom: '40px' }} />
      <div className="skeleton" style={{ width: '200px', height: '24px', marginBottom: '20px' }} />
      <TableSkeleton rows={3} />
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>Welcome, {user.name.split(' ')[0]}!</h2>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '4px' }}>Here's your current residence status overview.</p>
      </div>

      <div className="balance-card-premium" style={{ marginBottom: '40px', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '32px', position: 'relative', zIndex: 1 }}>
          {rankInfo.rank > 0 && (
            <div style={{ 
              position: 'absolute', top: '24px', right: '32px', 
              padding: '8px 16px', background: `${rankInfo.color}15`, 
              borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px',
              border: `1px solid ${rankInfo.color}30`,
              backdropFilter: 'blur(4px)'
            }}>
              <Crown size={14} color={rankInfo.color} fill={rankInfo.color} />
              <span style={{ color: rankInfo.color, fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Rank #{rankInfo.rank} Debt
              </span>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: totalUnpaid < 0 ? 'var(--success-glow)' : 'var(--accent-glow)', padding: '8px', borderRadius: '10px' }}>
              <Wallet size={18} color={totalUnpaid < 0 ? 'var(--success)' : 'var(--accent)'} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {totalUnpaid < 0 ? 'Advance Credit' : 'Outstanding Balance'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
            <h1 style={{ fontSize: '42px', fontWeight: '900', color: totalUnpaid < 0 ? 'var(--success)' : 'white', lineHeight: '1' }}>
              {totalUnpaid < 0 ? `+${formatCurrency(Math.abs(totalUnpaid))}` : formatCurrency(totalUnpaid)}
            </h1>
            {totalUnpaid > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>
                <AlertCircle size={12} /> ACTION REQUIRED
              </div>
            )}
            {totalUnpaid < 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>
                <CheckCircle size={12} /> ADVANCE PAID
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            <button 
              onClick={() => setIsGCashModalOpen(true)}
              className="btn btn-primary"
              style={{ padding: '10px 20px', minHeight: '44px', borderRadius: '12px', flex: 1 }}
            >
              <Smartphone size={16} /> <span>Quick Pay</span>
            </button>
            <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <CalendarDays size={16} color="var(--text2)" />
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text2)', textTransform: 'uppercase' }}>Last Update</div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: 'white' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '200px', height: '200px', background: 'var(--accent-glow)', filter: 'blur(60px)', borderRadius: '50%', opacity: 0.2 }} />
      </div>

      <Section title="Billing & Payment History" icon={Receipt}>
        {sortedMonths.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
            <Receipt size={40} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <p style={{ color: 'var(--text2)', fontWeight: '600' }}>No transaction history found.</p>
          </div>
        ) : sortedMonths.map((month) => {
          const isExpanded = expandedMonths[month];
          return (
            <div key={month} style={{ marginBottom: '12px' }}>
              <button 
                onClick={() => toggleMonth(month)} 
                style={{ 
                  width: '100%', background: isExpanded ? 'rgba(255,255,255,0.04)' : 'transparent', 
                  border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px', 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  marginBottom: isExpanded ? '16px' : '0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '6px', borderRadius: '8px', background: isExpanded ? 'var(--accent)' : 'rgba(255,255,255,0.05)', color: isExpanded ? 'white' : 'var(--text2)', transition: '0.2s' }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{month}</span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text2)', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '20px' }}>
                  {groupedHistory[month].length} Items
                </div>
              </button>
              
              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px', borderLeft: '2px solid var(--border)', marginLeft: '28px', paddingBottom: '24px' }}>
                  {groupedHistory[month].map((item, idx) => {
                    const isPayment = item.type === 'PAYMENT';
                    const isSettled = !isPayment && item.status === 'Paid';
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flexShrink: 0, width: '48px', height: '52px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent)', opacity: 0.8 }}>{getShortMonth(item.sortDate)}</div>
                          <div style={{ fontSize: '18px', fontWeight: '900', color: 'white', lineHeight: '1' }}>{getDayNumber(item.sortDate)}</div>
                        </div>
                        <div className="glass-card" style={{ flex: 1, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isPayment ? 'rgba(16, 185, 129, 0.03)' : 'transparent', border: '1px solid var(--border)', borderRadius: '14px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <CategoryBadge category={item.category || (isPayment ? 'Payment' : 'Other')} type={item.type} />
                              {isSettled && <span className="badge badge-success">Settled</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontWeight: '600' }}>{isPayment ? `Via ${item.method}` : item.description || 'Record Entry'}</span>
                              <span style={{ fontSize: '9px', opacity: 0.6 }}>{formatDateTimeWithPHT(item.sortDate)}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: isPayment ? 'var(--success)' : isSettled ? 'var(--text2)' : 'white' }}>
                              {isPayment ? '-' : '+'} {parseFloat(item.amount).toLocaleString()}
                            </div>
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
