import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { formatCurrency, formatShortDate } from '../../utils/formatters';
import { 
  Users as UsersIcon, AlertCircle, CreditCard, PlusCircle, 
  UserPlus, Edit, Trash2, RefreshCw, List, ReceiptText, Shield, Zap, TrendingUp, Search, History, RotateCcw, Crown
} from 'lucide-react';
import { StatCard, DashboardHeader, Section } from '../../components/common/DashboardUI';
import { CardSkeleton, TableSkeleton } from '../../components/common/Skeleton';
import ExpenseModal from '../../components/modals/ExpenseModal';
import UserModal from '../../components/modals/UserModal';
import PaymentModal from '../../components/modals/PaymentModal';
import HistoryModal from '../../components/modals/HistoryModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

const CategoryBadge = ({ category, type }) => {
  if (type === 'PAYMENT') return <span className="badge badge-success">Payment</span>;
  
  const catLower = (category || '').toLowerCase();
  let className = 'badge';
  if (catLower.includes('rent')) className += ' badge-rent';
  else if (catLower.includes('electricity')) className += ' badge-electricity';
  else if (catLower.includes('water')) className += ' badge-water';
  else if (catLower.includes('gas')) className += ' badge-gas';
  else if (catLower.includes('food') || catLower.includes('meal')) className += ' badge-food';
  
  return <span className={className}>{category}</span>;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotify();
  const [boarders, setBoarders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, title: '', message: '', strict: false, danger: false });

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  const triggerConfirm = (config) => setConfirmConfig({ ...config, isOpen: true });

  const fetchAdminData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [profilesRes, expensesRes, paymentsRes] = await Promise.all([
        supabase.from('profiles').select('*').in('role', ['Boarder', 'Admin']).order('name'),
        supabase.from('expenses').select('*, profiles(name)').order('due_date', { ascending: false }),
        supabase.from('payments').select('*, profiles(name)').order('date', { ascending: false })
      ]);
      setBoarders(profilesRes.data || []);
      setExpenses(expensesRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdminData(); }, [fetchAdminData]);

  const getResidentDebt = (resident) => {
    return parseFloat(resident.balance || 0);
  };

  const totalUnpaid = boarders.reduce((sum, b) => sum + getResidentDebt(b), 0);
  const totalCollected = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const [isRepairing, setIsRepairing] = useState(false);

  const executeRepair = async () => {
    setIsRepairing(true);
    try {
      const { data: allExpenses } = await supabase.from('expenses').select('id, profiles(id)');
      const orphanExpenseIds = allExpenses?.filter(e => !e.profiles).map(e => e.id) || [];
      const { data: allPayments } = await supabase.from('payments').select('id, profiles(id)');
      const orphanPaymentIds = allPayments?.filter(p => !p.profiles).map(p => p.id) || [];

      if (orphanExpenseIds.length > 0 || orphanPaymentIds.length > 0) {
        if (orphanExpenseIds.length > 0) await supabase.from('expenses').delete().in('id', orphanExpenseIds);
        if (orphanPaymentIds.length > 0) await supabase.from('payments').delete().in('id', orphanPaymentIds);
        showToast(`Repair complete.`, "success");
        fetchAdminData(true);
      } else {
        showToast("Database is healthy.", "info");
      }
    } catch (err) {
      showToast("Repair failed: " + err.message, "error");
    } finally {
      setIsRepairing(false);
    }
  };

  const handleRepair = () => {
    triggerConfirm({
      title: "Repair Database?",
      message: "This will clean up orphaned records that have no associated owners.",
      onConfirm: executeRepair,
      confirmText: "Start Repair"
    });
  };

  const executeGlobalReset = async () => {
    setLoading(true);
    try {
      await Promise.all([
        supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('profiles').update({ manual_debt: 0 }).neq('role', 'SuperAdmin')
      ]);
      showToast("System reset complete.", "success");
      fetchAdminData();
    } catch (err) {
      showToast("Reset failed", "error");
      setLoading(false);
    }
  };

  const handleGlobalReset = () => {
    triggerConfirm({
      title: "Wipe System History?",
      message: "DANGER: This will PERMANENTLY DELETE every single transaction for ALL residents.",
      danger: true,
      strict: true,
      confirmText: "Wipe Everything",
      onConfirm: executeGlobalReset
    });
  };

  const executeBackToZero = async (resident) => {
    try {
      await Promise.all([
        supabase.from('expenses').delete().eq('boarder_id', resident.id),
        supabase.from('payments').delete().eq('boarder_id', resident.id),
        supabase.from('profiles').update({ manual_debt: 0 }).eq('id', resident.id)
      ]);
      showToast(`Wiped history for ${resident.name}`, "success");
      fetchAdminData(true);
    } catch (err) {
      showToast("Failed", "error");
    }
  };

  const handleBackToZero = (resident) => {
    triggerConfirm({
      title: `Wipe ${resident.name}?`,
      message: `This will delete ALL past debts and payments for ${resident.name} forever.`,
      danger: true,
      strict: true,
      confirmText: "Wipe Resident History",
      onConfirm: () => executeBackToZero(resident)
    });
  };

  const executeUndo = async (item) => {
    const originalExpenses = [...expenses];
    const originalPayments = [...payments];
    if (item.type === 'PAYMENT') setPayments(prev => prev.filter(p => p.id !== item.id));
    else setExpenses(prev => prev.filter(e => e.id !== item.id));

    try {
      const table = item.type === 'PAYMENT' ? 'payments' : 'expenses';
      const { error } = await supabase.from(table).delete().eq('id', item.id);
      if (error) throw error;
      showToast(`Undo successful`, "success");
      fetchAdminData(true);
    } catch (err) {
      showToast("Undo failed: " + err.message, "error");
      setExpenses(originalExpenses);
      setPayments(originalPayments);
    }
  };

  const handleUndo = (item) => {
    triggerConfirm({
      title: "Undo Transaction?",
      message: `Delete this ${item.type === 'PAYMENT' ? 'payment' : 'debt'} for ${item.profiles?.name}?`,
      onConfirm: () => executeUndo(item),
      confirmText: "Yes, Delete"
    });
  };

  const handleUndoLastAction = async () => {
    const allActivity = [
      ...expenses.map(e => ({ ...e, type: 'DEBT', timestamp: e.created_at })),
      ...payments.map(p => ({ ...p, type: 'PAYMENT', timestamp: p.created_at }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (allActivity.length === 0) {
      showToast("No transactions found", "info");
      return;
    }

    const lastAction = allActivity[0];
    triggerConfirm({
      title: "Undo Last Action?",
      message: `Revert the most recent ${lastAction.type === 'PAYMENT' ? 'payment' : 'debt'} for ${lastAction.profiles?.name}?`,
      onConfirm: () => executeUndo(lastAction),
      confirmText: "Undo Action"
    });
  };

  return (
    <div className="fade-in">
      <DashboardHeader title={`Hi, ${user.name.split(' ')[0]}! 👋`} description="System Administrator Access">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleUndoLastAction} style={{ padding: '8px 16px', fontSize: '12px', borderColor: 'var(--accent-glow)' }}>
            <RotateCcw size={14} />
            <span style={{ marginLeft: '8px' }}>Undo Last</span>
          </button>
          <button className="btn btn-secondary" onClick={handleRepair} disabled={isRepairing} style={{ padding: '8px 16px', fontSize: '12px' }}>
            {isRepairing ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
            <span style={{ marginLeft: '8px' }}>Repair</span>
          </button>
          <button className="btn btn-secondary" onClick={handleGlobalReset} style={{ padding: '8px 16px', fontSize: '12px', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
            <Trash2 size={14} />
            <span style={{ marginLeft: '8px' }}>Wipe All</span>
          </button>
        </div>
      </DashboardHeader>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <StatCard label="Residents" value={boarders.length} icon={UsersIcon} trend="+2 new" />
          <StatCard label="Collectibles" value={formatCurrency(totalUnpaid)} icon={AlertCircle} color="var(--danger)" trend="Pending" />
          <StatCard label="Revenue" value={formatCurrency(totalCollected)} icon={TrendingUp} color="var(--success)" trend="Total" />
        </div>
      )}

      <div className="fab-container" style={{ position: 'static', display: 'flex', gap: '12px', marginBottom: '48px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" style={{ borderRadius: '12px' }} onClick={() => { setEditingItem(null); setIsUserModalOpen(true); }}>
          <UserPlus size={18} /> New Resident
        </button>
        <button className="btn btn-primary" style={{ borderRadius: '12px' }} onClick={() => { setEditingItem(null); setIsExpenseModalOpen(true); }}>
          <PlusCircle size={18} /> Add Debt
        </button>
        <button className="btn btn-primary" style={{ borderRadius: '12px' }} onClick={() => { setEditingItem(null); setIsPaymentModalOpen(true); }}>
          <CreditCard size={18} /> Record Payment
        </button>
      </div>

      <Section title="Resident Directory" icon={UsersIcon} action={
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input 
            type="text" placeholder="Search name..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ height: '36px', width: '180px', borderRadius: '10px', fontSize: '12px', paddingLeft: '34px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}
          />
        </div>
      }>
        {loading ? <TableSkeleton rows={4} /> : (
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
            <table style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--glass-light)' }}>
                <tr>
                  <th style={{ width: '35%', padding: '16px 24px' }}>Name</th>
                  <th style={{ width: '25%', padding: '16px 24px' }}>Debt</th>
                  <th style={{ width: '20%', padding: '16px 24px' }}>Status</th>
                  <th style={{ width: '20%', padding: '16px 24px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {boarders
                  .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a, b) => getResidentDebt(b) - getResidentDebt(a))
                  .map((b, index) => {
                    const debt = getResidentDebt(b);
                    const isTop1 = index === 0 && debt > 0;
                    const isTop2 = index === 1 && debt > 0;
                    const isTop3 = index === 2 && debt > 0;
                    const crownColor = isTop1 ? '#FFD700' : isTop2 ? '#C0C0C0' : isTop3 ? '#CD7F32' : null;

                    return (
                      <tr key={b.id} style={{ borderTop: '1px solid var(--border)', background: crownColor ? `linear-gradient(90deg, ${crownColor}10 0%, transparent 100%)` : 'transparent' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {crownColor && <Crown size={16} color={crownColor} fill={crownColor} style={{ filter: 'drop-shadow(0 0 4px ' + crownColor + '40)' }} />}
                            <button onClick={() => { setSelectedResident(b); setIsHistoryModalOpen(true); }} style={{ color: 'white', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontSize: '15px' }}>{b.name}</button>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px', paddingLeft: crownColor ? '24px' : '0' }}>@{b.username}</div>
                        </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: '800', color: debt > 0 ? 'var(--danger)' : 'var(--success)', fontSize: '15px' }}>{debt > 0 ? formatCurrency(debt) : 'CLEAR'}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className={`badge ${debt === 0 ? 'badge-success' : 'badge-warn'}`} style={{ padding: '4px 10px', fontSize: '10px' }}>{debt === 0 ? 'Settled' : 'Unpaid'}</span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div className="actions" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                          <button className="act-btn" onClick={() => handleBackToZero(b)} title="Wipe History" style={{ background: 'rgba(108, 140, 255, 0.1)', color: 'var(--accent)' }}><Zap size={14} fill="currentColor" /></button>
                          <button className="act-btn" onClick={() => { setSelectedResident(b); setIsHistoryModalOpen(true); }} title="History"><History size={14} /></button>
                          <button className="act-btn" onClick={() => { setEditingItem(b); setIsUserModalOpen(true); }} title="Edit"><Edit size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        <Section title="Pending Collections" icon={ReceiptText}>
          {loading ? <TableSkeleton rows={3} /> : (
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {expenses.filter(e => e.status !== 'Paid').length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>All debts collected! ✨</div>
                ) : (
                  expenses.filter(e => e.status !== 'Paid').map(exp => (
                    <div key={exp.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{exp.profiles?.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <CategoryBadge category={exp.category} type="DEBT" />
                          <span style={{ fontSize: '10px', opacity: 0.5 }}>{formatShortDate(exp.due_date)}</span>
                        </div>
                      </div>
                      <div style={{ fontWeight: '800', color: 'white' }}>{formatCurrency(exp.amount)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Section>

        <Section title="Recent Activity" icon={History}>
          {loading ? <TableSkeleton rows={3} /> : (
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {[...expenses.map(e => ({...e, type: 'DEBT'})), ...payments.map(p => ({...p, type: 'PAYMENT'}))]
                  .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
                  .slice(0, 30)
                  .map((item, idx) => (
                    <div key={idx} style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: item.type === 'PAYMENT' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.type === 'PAYMENT' ? <TrendingUp size={14} style={{ color: 'var(--success)' }} /> : <AlertCircle size={14} style={{ color: 'var(--danger)' }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{item.profiles?.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <CategoryBadge category={item.type === 'PAYMENT' ? 'Payment' : item.category} type={item.type} />
                            <span style={{ fontSize: '10px', opacity: 0.5 }}>{formatShortDate(item.created_at || item.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontWeight: '800', color: item.type === 'PAYMENT' ? 'var(--success)' : 'white', fontSize: '14px' }}>
                          {item.type === 'PAYMENT' ? '+' : '-'}{parseFloat(item.amount).toLocaleString()}
                        </div>
                        <button className="act-btn danger" onClick={() => handleUndo(item)} title="Undo Transaction" style={{ width: '28px', height: '28px', padding: 0, opacity: 0.4 }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Section>
      </div>

      <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} boarders={boarders} onSave={() => fetchAdminData(true)} />
      <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} editingUser={editingItem} onSave={() => fetchAdminData(true)} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} boarders={boarders} expenses={expenses} onSave={() => fetchAdminData(true)} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} user={selectedResident} />
      
      <ConfirmationModal 
        isOpen={confirmConfig.isOpen} onClose={closeConfirm} onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title} message={confirmConfig.message}
        danger={confirmConfig.danger} strict={confirmConfig.strict} confirmText={confirmConfig.confirmText}
      />
    </div>
  );
};

export default AdminDashboard;
