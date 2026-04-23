-- Add pricing_type and fixed_price_crc to items table
-- Allows items to have either weight-based (per gram) pricing OR fixed single price

ALTER TABLE items ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'per_gram';
ALTER TABLE items ADD COLUMN IF NOT EXISTS fixed_price_crc NUMERIC DEFAULT 0;

-- Set default values for existing items
UPDATE items SET pricing_type = 'per_gram', fixed_price_crc = 0 WHERE pricing_type IS NULL;

-- Add comment
COMMENT ON COLUMN items.pricing_type IS 'Type of pricing: per_gram (weight-based) or fixed (single price)';
COMMENT ON COLUMN items.fixed_price_crc IS 'Fixed price in CRC for items that are sold at a single price';