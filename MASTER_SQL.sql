-- ======================================================
-- APARTMENT MANAGER: MASTER SQL REPOSITORY (ALIGNED ARCHITECTURE)
-- ======================================================

-- ------------------------------------------------------
-- 1. CRITICAL CLEANUP (FIXES "relation notifications does not exist")
-- ------------------------------------------------------
-- This section removes old triggers and the obsolete notifications table.

-- Drop old triggers that might still be looking for the "notifications" table
DROP TRIGGER IF EXISTS trg_notif_expense ON expenses;
DROP TRIGGER IF EXISTS trg_notif_payment ON payments;

-- Drop the old notifications table
DROP TABLE IF EXISTS public.notifications;

-- Ensure the new columns exist in Expenses and Payments
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS notif_title TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS notif_message TEXT;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS notif_title TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS notif_message TEXT;

-- ------------------------------------------------------
-- 2. UPDATED TRIGGERS (SELF-NOTIFYING TRANSACTIONS)
-- ------------------------------------------------------

DROP FUNCTION IF EXISTS create_notification_on_change() CASCADE;
CREATE OR REPLACE FUNCTION create_notification_on_change() RETURNS TRIGGER AS $$
DECLARE
    v_display_date TEXT;
BEGIN
    IF TG_TABLE_NAME = 'expenses' THEN
        v_display_date := to_char(NEW.due_date, 'Mon DD, YYYY');
        
        IF (TG_OP = 'INSERT') THEN
            NEW.notif_title := 'New Debt Recorded';
            NEW.notif_message := 'A new ' || NEW.category || ' expense of ₱' || NEW.amount || ' has been added for ' || v_display_date || '.';
            NEW.is_read := FALSE;
        ELSIF (TG_OP = 'UPDATE') THEN
            -- Only notify if amount, category, or date changed, OR if status became Paid
            IF (OLD.amount != NEW.amount OR OLD.category != NEW.category OR OLD.due_date != NEW.due_date) THEN
                NEW.notif_title := 'Debt Updated';
                NEW.notif_message := 'Your ' || NEW.category || ' expense for ' || v_display_date || ' was updated to ₱' || NEW.amount || '.';
                NEW.is_read := FALSE;
            ELSIF (OLD.status != 'Paid' AND NEW.status = 'Paid') THEN
                NEW.notif_title := 'Debt Cleared';
                NEW.notif_message := 'Your ' || NEW.category || ' expense for ' || v_display_date || ' has been marked as Paid.';
                NEW.is_read := FALSE;
            END IF;
        END IF;

    ELSIF TG_TABLE_NAME = 'payments' THEN
        v_display_date := to_char(NEW.date, 'Mon DD, YYYY');
        
        IF (TG_OP = 'INSERT') THEN
            NEW.notif_title := 'Payment Received';
            NEW.notif_message := 'A payment of ₱' || NEW.amount || ' was successfully recorded on ' || v_display_date || '.';
            NEW.is_read := FALSE;
        ELSIF (TG_OP = 'UPDATE') THEN
            IF (OLD.amount != NEW.amount OR OLD.date != NEW.date) THEN
                NEW.notif_title := 'Payment Updated';
                NEW.notif_message := 'Your payment recorded on ' || v_display_date || ' has been updated to ₱' || NEW.amount || '.';
                NEW.is_read := FALSE;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach as BEFORE triggers (so they modify the record before it's saved)
CREATE TRIGGER trg_notif_expense BEFORE INSERT OR UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION create_notification_on_change();
CREATE TRIGGER trg_notif_payment BEFORE INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION create_notification_on_change();

-- ------------------------------------------------------
-- 3. ATOMIC PAYMENT FUNCTION
-- ------------------------------------------------------

CREATE OR REPLACE FUNCTION record_payment_v3(
  p_boarder_id UUID,
  p_amount NUMERIC,
  p_method TEXT,
  p_expense_id UUID,
  p_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  p_category TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO payments (boarder_id, amount, method, expense_id, date, category)
  VALUES (p_boarder_id, p_amount, p_method, p_expense_id, p_date, p_category);

  IF p_expense_id IS NOT NULL THEN
    UPDATE expenses SET status = 'Paid' WHERE id = p_expense_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------
-- 4. ADDITIONAL MIGRATIONS (V4.1)
-- ------------------------------------------------------
-- Run these to support Name Change Limits and Password Change Limits.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name_changes_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_changes_count INT DEFAULT 0;

-- ------------------------------------------------------
-- 5. PROFILE RECOVERY & SYNC
-- ------------------------------------------------------
/*
TRUNCATE public.profiles CASCADE;
INSERT INTO public.profiles (id, username, name, role, status)
SELECT id, LOWER(SPLIT_PART(email, '@', 1)), INITCAP(SPLIT_PART(email, '@', 1)),
CASE WHEN LOWER(email) LIKE 'francis%' THEN 'Admin' WHEN LOWER(email) LIKE 'admin%' THEN 'Admin' ELSE 'Boarder' END, 'Active'
FROM auth.users;
*/
