-- =============================================================================
-- RLS POLICIES FIX
-- Allow public read/write access using anon key for CrystalPOS
-- =============================================================================

-- Users table - full access
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_all" ON users FOR ALL USING (true) WITH CHECK (true);

-- Categories table - full access
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
CREATE POLICY "categories_all" ON categories FOR ALL USING (true) WITH CHECK (true);

-- Subcategories table - full access
DROP POLICY IF EXISTS "subcategories_select" ON subcategories;
DROP POLICY IF EXISTS "subcategories_insert" ON subcategories;
DROP POLICY IF EXISTS "subcategories_update" ON subcategories;
CREATE POLICY "subcategories_all" ON subcategories FOR ALL USING (true) WITH CHECK (true);

-- Items table - full access
DROP POLICY IF EXISTS "items_select" ON items;
DROP POLICY IF EXISTS "items_insert" ON items;
DROP POLICY IF EXISTS "items_update" ON items;
CREATE POLICY "items_all" ON items FOR ALL USING (true) WITH CHECK (true);

-- Inventory transactions - full access
DROP POLICY IF EXISTS "inventory_transactions_select" ON inventory_transactions;
DROP POLICY IF EXISTS "inventory_transactions_insert" ON inventory_transactions;
CREATE POLICY "inventory_transactions_all" ON inventory_transactions FOR ALL USING (true) WITH CHECK (true);

-- Sales table - full access
DROP POLICY IF EXISTS "sales_select" ON sales;
DROP POLICY IF EXISTS "sales_insert" ON sales;
DROP POLICY IF EXISTS "sales_update" ON sales;
CREATE POLICY "sales_all" ON sales FOR ALL USING (true) WITH CHECK (true);

-- Bookkeeping entries - full access
DROP POLICY IF EXISTS "bookkeeping_entries_select" ON bookkeeping_entries;
DROP POLICY IF EXISTS "bookkeeping_entries_insert" ON bookkeeping_entries;
CREATE POLICY "bookkeeping_entries_all" ON bookkeeping_entries FOR ALL USING (true) WITH CHECK (true);

-- Daily reports - full access
DROP POLICY IF EXISTS "daily_reports_select" ON daily_reports;
CREATE POLICY "daily_reports_all" ON daily_reports FOR ALL USING (true) WITH CHECK (true);

-- Audit logs - full access
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Device registrations - full access
DROP POLICY IF EXISTS "Allow all access to device_registrations" ON device_registrations;
CREATE POLICY "device_registrations_all" ON device_registrations FOR ALL USING (true) WITH CHECK (true);

-- Pending sales - full access
DROP POLICY IF EXISTS "Allow all access to pending_sales" ON pending_sales;
CREATE POLICY "pending_sales_all" ON pending_sales FOR ALL USING (true) WITH CHECK (true);

-- Error logs - full access
DROP POLICY IF EXISTS "Allow all access to error_logs" ON error_logs;
CREATE POLICY "error_logs_all" ON error_logs FOR ALL USING (true) WITH CHECK (true);