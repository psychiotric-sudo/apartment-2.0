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

-- 5. ATOMIC PAYMENT FUNCTION
CREATE OR REPLACE FUNCTION record_payment_v2(
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

-- 6. RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read" ON profiles FOR SELECT USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));
CREATE POLICY "Admin full access profiles" ON profiles FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));

CREATE POLICY "Users see own expenses" ON expenses FOR SELECT USING (boarder_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));
CREATE POLICY "Admin full access expenses" ON expenses FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));

CREATE POLICY "Users see own payments" ON payments FOR SELECT USING (boarder_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));
CREATE POLICY "Admin full access payments" ON payments FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'TopMan'));
