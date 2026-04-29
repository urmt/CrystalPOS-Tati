-- =============================================================================
-- CUSTOMERS TABLE MIGRATION
-- Version: 1.0
-- Date: April 29, 2026
-- Description: Add customers table for WhatsApp receipt catalog
-- =============================================================================

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  country_code TEXT DEFAULT '+506',
  name TEXT,
  total_purchases NUMERIC DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  last_purchase DATE,
  special_requests TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add customer fields to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 3. Add indexes
DROP INDEX IF EXISTS idx_customers_phone;
CREATE INDEX idx_customers_phone ON customers(phone);

DROP INDEX IF EXISTS idx_sales_customer_phone;
CREATE INDEX idx_sales_customer_phone ON sales(customer_phone);

-- 4. Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers (same as sales)
CREATE POLICY "customers_select" ON customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Add customer to types
DO $$ 
BEGIN
  RAISE NOTICE 'Customers table migration completed!';
END $$;