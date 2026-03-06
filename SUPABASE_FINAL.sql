-- 1. BALANCE MAINTENANCE FUNCTIONS
CREATE OR REPLACE FUNCTION update_boarder_balance() RETURNS TRIGGER AS $$
DECLARE
    v_boarder_id UUID;
    v_manual_debt NUMERIC;
    v_total_expenses NUMERIC;
    v_total_payments NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_boarder_id := OLD.boarder_id;
    ELSE
        v_boarder_id := NEW.boarder_id;
    END IF;

    SELECT manual_debt INTO v_manual_debt FROM profiles WHERE id = v_boarder_id;
    
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses 
    FROM expenses 
    WHERE boarder_id = v_boarder_id AND status != 'Paid';

    SELECT COALESCE(SUM(amount), 0) INTO v_total_payments 
    FROM payments 
    WHERE boarder_id = v_boarder_id AND expense_id IS NULL;

    UPDATE profiles
    SET balance = v_manual_debt + v_total_expenses - v_total_payments
    WHERE id = v_boarder_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply triggers (Safe as they are replaced if they exist)
DROP TRIGGER IF EXISTS trg_update_balance_expense ON expenses;
CREATE TRIGGER trg_update_balance_expense
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_boarder_balance();

DROP TRIGGER IF EXISTS trg_update_balance_payment ON payments;
CREATE TRIGGER trg_update_balance_payment
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION update_boarder_balance();

CREATE OR REPLACE FUNCTION update_profile_balance_on_manual_debt() RETURNS TRIGGER AS $$
DECLARE
    v_total_expenses NUMERIC;
    v_total_payments NUMERIC;
BEGIN
    IF (OLD.manual_debt IS DISTINCT FROM NEW.manual_debt) THEN
        SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses 
        FROM expenses 
        WHERE boarder_id = NEW.id AND status != 'Paid';

        SELECT COALESCE(SUM(amount), 0) INTO v_total_payments 
        FROM payments 
        WHERE boarder_id = NEW.id AND expense_id IS NULL;

        NEW.balance := NEW.manual_debt + v_total_expenses - v_total_payments;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_profile_balance ON profiles;
CREATE TRIGGER trg_update_profile_balance
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_profile_balance_on_manual_debt();

-- 2. ADVANCE CONSUMPTION LOGIC
CREATE OR REPLACE FUNCTION auto_pay_expense_with_advance() RETURNS TRIGGER AS $$
DECLARE
    v_payment_id UUID;
    v_payment_amount NUMERIC;
BEGIN
    -- Find the oldest unassigned payment for this boarder and category
    SELECT id, amount INTO v_payment_id, v_payment_amount
    FROM payments
    WHERE boarder_id = NEW.boarder_id 
      AND category = NEW.category 
      AND expense_id IS NULL
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_payment_id IS NOT NULL THEN
        -- If payment exactly matches or exceeds the expense
        IF v_payment_amount >= NEW.amount THEN
            -- Mark expense as paid
            NEW.status := 'Paid';
            
            -- If it exceeds, we need to split the payment row to keep the remainder as unassigned
            IF v_payment_amount > NEW.amount THEN
                -- Update original payment to the excess amount
                UPDATE payments SET amount = v_payment_amount - NEW.amount WHERE id = v_payment_id;
                -- Create a new payment row for the paid amount linked to this expense
                INSERT INTO payments (boarder_id, amount, method, category, expense_id, date)
                SELECT boarder_id, NEW.amount, method, category, NEW.id, date
                FROM payments WHERE id = v_payment_id;
            ELSE
                -- Exact match, just link it
                UPDATE payments SET expense_id = NEW.id WHERE id = v_payment_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_pay_expense ON expenses;
CREATE TRIGGER trg_auto_pay_expense
BEFORE INSERT ON expenses
FOR EACH ROW EXECUTE FUNCTION auto_pay_expense_with_advance();

-- 3. ATOMIC PAYMENT FUNCTION
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

-- 4. RLS POLICIES (Re-apply safely)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All Auth Read" ON profiles;
CREATE POLICY "Allow All Auth Read" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow Admin All" ON profiles;
CREATE POLICY "Allow Admin All" ON profiles FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Users see own expenses" ON expenses;
CREATE POLICY "Users see own expenses" ON expenses FOR SELECT USING (boarder_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));
DROP POLICY IF EXISTS "Admin full access expenses" ON expenses;
CREATE POLICY "Admin full access expenses" ON expenses FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));

DROP POLICY IF EXISTS "Users see own payments" ON payments;
CREATE POLICY "Users see own payments" ON payments FOR SELECT USING (boarder_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));
DROP POLICY IF EXISTS "Admin full access payments" ON payments;
CREATE POLICY "Admin full access payments" ON payments FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));

-- 5. NOTIFICATION TRIGGERS
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

DROP TRIGGER IF EXISTS trg_notif_expense ON expenses;
CREATE TRIGGER trg_notif_expense BEFORE INSERT OR UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION create_notification_on_change();
DROP TRIGGER IF EXISTS trg_notif_payment ON payments;
CREATE TRIGGER trg_notif_payment BEFORE INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION create_notification_on_change();
