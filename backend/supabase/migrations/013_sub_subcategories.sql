-- Migration 013: Add sub_subcategories table (3rd level of hierarchy)
-- and add sub_subcategory_id + stock_unit to items table

-- 1. Create sub_subcategories table
CREATE TABLE IF NOT EXISTS sub_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_es TEXT,
  description TEXT,
  description_es TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add sub_subcategory_id to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS sub_subcategory_id UUID REFERENCES sub_subcategories(id) ON DELETE SET NULL;

-- 3. Add stock_unit to items table (for unit-based items like incense, chess boards)
ALTER TABLE items ADD COLUMN IF NOT EXISTS stock_unit INTEGER DEFAULT 0;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sub_subcategories_subcategory_id ON sub_subcategories(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_items_sub_subcategory_id ON items(sub_subcategory_id);

-- 5. Enable RLS (wide open, matching existing pattern from migration 003)
ALTER TABLE sub_subcategories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations' AND tablename = 'sub_subcategories') THEN
    CREATE POLICY "Allow all operations" ON sub_subcategories FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
