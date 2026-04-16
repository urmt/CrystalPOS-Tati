-- =============================================================================
-- DEVICE REGISTRATION TABLE
-- For managing iPad POS devices
-- =============================================================================

CREATE TABLE IF NOT EXISTS device_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  device_name TEXT,
  is_blocked BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to device_registrations" ON device_registrations 
  FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_device_id ON device_registrations(device_id);

-- =============================================================================
-- PENDING SALES QUEUE TABLE  
-- For offline sales syncing
-- =============================================================================

CREATE TABLE IF NOT EXISTS pending_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  sale_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE pending_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to pending_sales" ON pending_sales 
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_pending_sales_device ON pending_sales(device_id);
CREATE INDEX idx_pending_sales_synced ON pending_sales(synced_at) WHERE synced_at IS NULL;

-- =============================================================================
-- ERROR LOGS TABLE
-- For tracking system errors and sending Telegram alerts
-- =============================================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to error_logs" ON error_logs 
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_unresolved ON error_logs(resolved) WHERE resolved = false;

-- =============================================================================
-- Telegram Alert Function
-- =============================================================================

CREATE OR REPLACE FUNCTION log_error(
  p_error_type TEXT,
  p_error_message TEXT,
  p_device_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO error_logs (error_type, error_message, device_id)
  VALUES (p_error_type, p_error_message, p_device_id);
END;
$$;