-- =============================================================================
-- CUSTOMERS TABLE MIGRATION - FIX FOR 401 ERROR  
-- =============================================================================

-- First, completely disable RLS on customers table
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_insert" ON customers;
DROP POLICY IF EXISTS "customers_update" ON customers;

-- Create proper policies (same as sales table - authenticated or anon can read)
CREATE POLICY "customers_select" ON customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "customers_insert" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "customers_update" ON customers FOR UPDATE TO anon, authenticated USING (true);

-- Make sure anon can access (for the public API key)
GRANT SELECT ON customers TO anon;
GRANT INSERT ON customers TO anon;
GRANT UPDATE ON customers TO anon;

DO $$ 
BEGIN
  RAISE NOTICE 'Customers table RLS fixed - should now allow public access!';
END $$;