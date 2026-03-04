-- 1. CLEANUP
DROP TABLE IF EXISTS payments, expenses, profiles CASCADE;

-- 2. PROFILES TABLE
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('Admin', 'TopMan', 'Boarder')) DEFAULT 'Boarder',
  manual_debt NUMERIC DEFAULT 0,
  manual_debt_date TIMESTAMPTZ DEFAULT NOW(),
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EXPENSES TABLE
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boarder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Rent', 'Electricity', 'Water', 'Gas', 'Meals/Food')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  description TEXT,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENTS TABLE
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boarder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  method TEXT NOT NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BALANCE MAINTENANCE FUNCTIONS
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
    SET balance = GREATEST(0, v_manual_debt + v_total_expenses - v_total_payments)
    WHERE id = v_boarder_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGERS FOR EXPENSES AND PAYMENTS
CREATE TRIGGER trg_update_balance_expense
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_boarder_balance();

CREATE TRIGGER trg_update_balance_payment
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION update_boarder_balance();

-- Function to update balance when manual_debt changes
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

        NEW.balance := GREATEST(0, NEW.manual_debt + v_total_expenses - v_total_payments);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_profile_balance
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_profile_balance_on_manual_debt();

-- 6. ATOMIC PAYMENT FUNCTION
CREATE OR REPLACE FUNCTION record_payment_v3(
  p_boarder_id UUID,
  p_amount NUMERIC,
  p_method TEXT,
  p_expense_id UUID
) RETURNS void AS $$
BEGIN
  INSERT INTO payments (boarder_id, amount, method, expense_id, date)
  VALUES (p_boarder_id, p_amount, p_method, p_expense_id, CURRENT_TIMESTAMP);

  IF p_expense_id IS NOT NULL THEN
    UPDATE expenses SET status = 'Paid' WHERE id = p_expense_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to see profiles (so boarders can see their rank)
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access profiles" ON profiles FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));

CREATE POLICY "Users see own expenses" ON expenses FOR SELECT USING (boarder_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));
CREATE POLICY "Admin full access expenses" ON expenses FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));

CREATE POLICY "Users see own payments" ON payments FOR SELECT USING (boarder_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));
CREATE POLICY "Admin full access payments" ON payments FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));
