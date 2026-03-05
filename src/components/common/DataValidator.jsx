import React, { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';

const DataValidator = () => {
  const { user } = useAuth();
  const { showToast } = useNotify();

  useEffect(() => {
    if (user?.role === 'Admin') {
      runAudit();
    }
  }, [user]);

  const runAudit = async () => {
    try {
      const issues = [];
      const { data: expenses, error } = await supabase.from('expenses').select('id, boarder_id, profiles(id)');
      if (error) throw error;
      
      const orphans = expenses?.filter(e => !e.profiles) || [];
      if (orphans.length > 0) issues.push(`${orphans.length} expenses have deleted owners.`);

      if (issues.length > 0) {
        showToast(`Audit Warning: ${issues[0]}`, 'error');
      }
    } catch (err) {
      console.error("Audit failed:", err);
    }
  };

  return null;
};

export default DataValidator;
