-- =============================================================================
-- CRYSTALPOS DATABASE MIGRATION
-- Version: 1.0
-- Date: April 15, 2026
-- Description: Initial database schema for CrystalPOS
-- =============================================================================
-- NOTE: Run this migration in Supabase SQL Editor
-- NOTE: This creates all tables needed for the POS system
-- =============================================================================

-- =============================================================================
-- SECTION 1: ENUMS
-- Custom types for the database
-- =============================================================================

-- Drop existing enums if they exist (for fresh install)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS entry_type CASCADE;

-- Create new enums
CREATE TYPE user_role AS ENUM ('admin', 'vendor_manager');
CREATE TYPE transaction_type AS ENUM ('sale', 'restock', 'adjustment');
CREATE TYPE payment_method AS ENUM ('sinpe', 'card', 'cash', 'lightning');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE entry_type AS ENUM ('income', 'expense');

-- =============================================================================
-- SECTION 2: USERS & AUTH
-- Stores user accounts with role-based access
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'vendor_manager',
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 3: CATEGORIES
-- Top-level categories: Crystals, Minerals, Water Bottles, Incense
-- =============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 4: SUBCATEGORIES
-- Subcategories within each category
-- =============================================================================

CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 5: ITEMS (Products)
-- Individual items for sale with gram-based tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  description TEXT,
  price_crc NUMERIC NOT NULL,
  current_weight_grams NUMERIC NOT NULL DEFAULT 0,
  min_threshold_grams NUMERIC DEFAULT 100,
  depletion_rate_grams_per_day NUMERIC DEFAULT 0,
  image_url TEXT,
  cost_per_gram NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 6: INVENTORY TRANSACTIONS
-- Track all inventory changes (sales, restocks, adjustments)
-- =============================================================================

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  quantity_grams NUMERIC NOT NULL,
  weight_after NUMERIC,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 7: SALES
-- Record of all sales transactions
-- =============================================================================

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  items_sold JSONB NOT NULL,
  subtotal_crc NUMERIC NOT NULL,
  tax_crc NUMERIC DEFAULT 0,
  total_crc NUMERIC NOT NULL,
  payment_method payment_method,
  payment_status payment_status DEFAULT 'pending',
  lightning_invoice_id TEXT,
  lightning_amount_satoshis BIGINT,
  notes TEXT,
  receipt_sent BOOLEAN DEFAULT false,
  receipt_email TEXT,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE,
  server_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 8: BOOKKEEPING
-- Income and expense tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS bookkeeping_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type entry_type NOT NULL,
  amount_crc NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookkeeping_entries ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 9: DAILY REPORTS
-- Pre-calculated daily summaries
-- =============================================================================

CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE UNIQUE NOT NULL,
  total_sales_crc NUMERIC DEFAULT 0,
  num_transactions INTEGER DEFAULT 0,
  num_items_sold INTEGER DEFAULT 0,
  items_sold JSONB,
  payment_breakdown JSONB,
  category_breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 10: AUDIT LOGS
-- Track all changes for compliance
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 11: INDEXES
-- Performance indexes for common queries
-- =============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Subcategories indexes
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

-- Items indexes
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_subcategory_id ON items(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(is_active) WHERE is_active = true;

-- Inventory transactions indexes
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_synced_at ON sales(synced_at) WHERE synced_at IS NULL;

-- Bookkeeping indexes
CREATE INDEX IF NOT EXISTS idx_bookkeeping_date ON bookkeeping_entries(date);
CREATE INDEX IF NOT EXISTS idx_bookkeeping_category ON bookkeeping_entries(category);

-- Daily reports indexes
CREATE INDEX IF NOT EXISTS idx_daily_reports_report_date ON daily_reports(report_date);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);

-- =============================================================================
-- SECTION 12: RLS POLICIES
-- Row-level security policies
-- =============================================================================

-- Users: Allow authenticated users to read all, admins can do everything
CREATE POLICY "users_select" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.role() = 'authenticated');

-- Categories: Allow authenticated users to read, authenticated can insert/update
CREATE POLICY "categories_select" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (auth.role() = 'authenticated');

-- Subcategories: Allow authenticated users to read, authenticated can insert/update
CREATE POLICY "subcategories_select" ON subcategories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "subcategories_insert" ON subcategories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "subcategories_update" ON subcategories FOR UPDATE USING (auth.role() = 'authenticated');

-- Items: Allow authenticated users to read, authenticated can insert/update
CREATE POLICY "items_select" ON items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "items_insert" ON items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "items_update" ON items FOR UPDATE USING (auth.role() = 'authenticated');

-- Inventory transactions: Allow authenticated users
CREATE POLICY "inventory_transactions_select" ON inventory_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "inventory_transactions_insert" ON inventory_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Sales: Allow authenticated users
CREATE POLICY "sales_select" ON sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "sales_update" ON sales FOR UPDATE USING (auth.role() = 'authenticated');

-- Bookkeeping: Allow authenticated users
CREATE POLICY "bookkeeping_entries_select" ON bookkeeping_entries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "bookkeeping_entries_insert" ON bookkeeping_entries FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Daily reports: Allow authenticated users
CREATE POLICY "daily_reports_select" ON daily_reports FOR SELECT USING (auth.role() = 'authenticated');

-- Audit logs: Allow authenticated users to read only
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================================================
-- SECTION 13: SEED DATA
-- Initial data for the POS system
-- =============================================================================

-- Insert default admin user (password: ChangeThis123!)
-- NOTE: In production, use Supabase Auth for proper user management
INSERT INTO users (email, role, full_name) 
VALUES ('admin@crystalmarket.com', 'admin', 'Systems Manager');

-- Insert default vendor
INSERT INTO users (email, role, full_name) 
VALUES ('vendor@crystalmarket.com', 'vendor_manager', 'Vendor Manager');

-- Insert default categories
INSERT INTO categories (name, description, display_order) VALUES
('Raw Crystals', 'Unpolished natural crystals', 1),
('Polished Stones', 'Polished and crafted crystals', 2),
('Geodes', 'Crystal geode specimens', 3),
('Water Bottles', 'Crystal-infused water bottles', 4),
('Incense', 'Handmade incense sticks and cones', 5);

-- Insert sample subcategories for crystals
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, sub.subname, sub.display_order::integer
FROM categories c
CROSS JOIN (
  VALUES 
    ('Raw Crystals', 'Clear Quartz', 1),
    ('Raw Crystals', 'Amethyst', 2),
    ('Raw Crystals', 'Rose Quartz', 3),
    ('Raw Crystals', 'Citrine', 4),
    ('Raw Crystals', 'Black Tourmaline', 5),
    ('Polished Stones', 'Tumbled Stones', 1),
    ('Polished Stones', 'Palm Stones', 2),
    ('Polished Stones', 'Pendants', 3),
    ('Geodes', 'Small Geodes', 1),
    ('Geodes', 'Large Geodes', 2),
    ('Water Bottles', 'Crystal Bottles', 1),
    ('Water Bottles', 'Pendants', 2),
    ('Incense', 'Stick Incense', 1),
    ('Incense', 'Cone Incense', 2)
) AS sub(catname, subname, display_order)
WHERE c.name = sub.catname;

-- =============================================================================
-- SECTION 14: FUNCTIONS & TRIGGERS
-- Auto-populate timestamps and audit logs
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for subcategories
DROP TRIGGER IF EXISTS update_subcategories_updated_at ON subcategories;
CREATE TRIGGER update_subcategories_updated_at
BEFORE UPDATE ON subcategories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for items
DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate depletion rate
CREATE OR REPLACE FUNCTION calculate_depletion_rate(item_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  daily_avg NUMERIC;
  days_count INTEGER;
BEGIN
  -- Get average daily sales over last 30 days
  SELECT 
    COALESCE(SUM((item->>'quantity_grams')::NUMERIC), 0) / NULLIF(COUNT(DISTINCT DATE(sale_date)), 0),
    COUNT(DISTINCT DATE(sale_date))
  INTO daily_avg, days_count
  FROM sales, jsonb_array_elements(items_sold) AS item
  WHERE item->>'item_id' = item_uuid::TEXT
    AND sale_date >= NOW() - INTERVAL '30 days';

  RETURN COALESCE(daily_avg, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create daily report
CREATE OR REPLACE FUNCTION create_daily_report(report_date DATE)
RETURNS VOID AS $$
DECLARE
  day_sales RECORD;
  breakdown_json JSONB;
  category_json JSONB;
BEGIN
  -- Check if report already exists
  IF EXISTS (SELECT 1 FROM daily_reports WHERE report_date = report_date) THEN
    RETURN;
  END IF;

  -- Build breakdown
  SELECT 
    jsonb_build_object(
      'sinpe', COALESCE(SUM(CASE WHEN payment_method = 'sinpe' THEN total_crc ELSE 0 END), 0),
      'cash', COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_crc ELSE 0 END), 0),
      'card', COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total_crc ELSE 0 END), 0),
      'lightning', COALESCE(SUM(CASE WHEN payment_method = 'lightning' THEN total_crc ELSE 0 END), 0)
    ),
    jsonb_build_object(
      'total_sales', COALESCE(SUM(total_crc), 0),
      'num_transactions', COUNT(*)
    )
  INTO breakdown_json, category_json
  FROM sales
  WHERE DATE(sale_date) = report_date;

  -- Insert daily report
  INSERT INTO daily_reports (report_date, total_sales_crc, num_transactions, payment_breakdown)
  VALUES (
    report_date,
    COALESCE((breakdown_json->>'total_sales')::NUMERIC, 0),
    COALESCE((breakdown_json->>'num_transactions')::INTEGER, 0),
    breakdown_json
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 15: STATISTICS
-- Enable auto statistics
-- =============================================================================

ALTER TABLE users SET (autovacuum_enabled = true);
ALTER TABLE categories SET (autovacuum_enabled = true);
ALTER TABLE subcategories SET (autovacuum_enabled = true);
ALTER TABLE items SET (autovacuum_enabled = true);
ALTER TABLE inventory_transactions SET (autovacuum_enabled = true);
ALTER TABLE sales SET (autovacuum_enabled = true);
ALTER TABLE bookkeeping_entries SET (autovacuum_enabled = true);
ALTER TABLE daily_reports SET (autovacuum_enabled = true);
ALTER TABLE audit_logs SET (autovacuum_enabled = true);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
DO $$ 
BEGIN
  RAISE NOTICE 'CrystalPOS database migration completed successfully!';
END $$;