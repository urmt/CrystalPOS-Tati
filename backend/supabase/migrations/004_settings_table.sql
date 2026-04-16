-- =============================================================================
-- SETTINGS TABLE
-- Stores business and payment settings
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_all" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default settings
INSERT INTO app_settings (setting_key, setting_value) VALUES 
  ('business', '{"business_name": "Crystal Market", "business_email": "info@crystalmarket.com", "business_phone": "+506 1234 5678", "address": "Costa Rica"}'),
  ('payments', '{"sinpe_enabled": true, "cash_enabled": true, "card_enabled": true, "lightning_enabled": true}')
ON CONFLICT (setting_key) DO NOTHING;