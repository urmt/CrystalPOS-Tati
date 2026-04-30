-- =============================================================================
-- TODOS TABLE MIGRATION
-- Version: 1.0
-- Description: Table for Tati's TODO/Requests list
-- =============================================================================

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_text TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  created_by TEXT DEFAULT 'tati', -- 'tati' or 'admin'
  status TEXT DEFAULT 'pending', -- 'pending' or 'done'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_created_by ON todos(created_by);

-- Allow public access (for the public API key)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos_select" ON todos;
DROP POLICY IF EXISTS "todos_insert" ON todos;
DROP POLICY IF EXISTS "todos_update" ON todos;
DROP POLICY IF EXISTS "todos_delete" ON todos;

CREATE POLICY "todos_select" ON todos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "todos_insert" ON todos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "todos_update" ON todos FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "todos_delete" ON todos FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT ON todos TO anon;
GRANT INSERT ON todos TO anon;
GRANT UPDATE ON todos TO anon;
GRANT DELETE ON todos TO anon;

DO $$ 
BEGIN
  RAISE NOTICE 'Todos table created!';
END $$;