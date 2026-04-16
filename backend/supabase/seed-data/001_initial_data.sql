-- =============================================================================
-- CRYSTALPOS SEED DATA
-- Version: 1.0
-- Date: April 15, 2026
-- Description: Sample data for testing CrystalPOS
-- =============================================================================
-- NOTE: Run this in Supabase SQL Editor after running migrations
-- =============================================================================

-- =============================================================================
-- SECTION 1: SAMPLE ITEMS
-- Test items for each category
-- =============================================================================

-- Get category IDs for reference
DO $$
DECLARE
  raw_crystals_id UUID;
  polished_id UUID;
  geodes_id UUID;
  water_id UUID;
  incense_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO raw_crystals_id FROM categories WHERE name = 'Raw Crystals';
  SELECT id INTO polished_id FROM categories WHERE name = 'Polished Stones';
  SELECT id INTO geodes_id FROM categories WHERE name = 'Geodes';
  SELECT id INTO water_id FROM categories WHERE name = 'Water Bottles';
  SELECT id INTO incense_id FROM categories WHERE name = 'Incense';

  -- Insert sample items for Raw Crystals
  INSERT INTO items (sku, name, category_id, description, price_crc, current_weight_grams, min_threshold_grams, cost_per_gram) VALUES
    ('CQ-RAW-001', 'Clear Quartz Point - Small', raw_crystals_id, 'Natural clear quartz point, 2-3 inches', 2500, 150, 50, 10),
    ('CQ-RAW-002', 'Clear Quartz Point - Medium', raw_crystals_id, 'Natural clear quartz point, 3-4 inches', 4500, 280, 75, 12),
    ('CQ-RAW-003', 'Clear Quartz Point - Large', raw_crystals_id, 'Natural clear quartz point, 4-6 inches', 8500, 450, 100, 15),
    ('AM-RAW-001', 'Amethyst Point - Small', raw_crystals_id, 'Natural amethyst point, deep purple', 3500, 120, 50, 18),
    ('AM-RAW-002', 'Amethyst Point - Medium', raw_crystals_id, 'Natural amethyst point, 3-4 inches', 6500, 250, 75, 22),
    ('AM-RAW-003', 'Amethyst Cathedral', raw_crystals_id, 'Large amethyst cathedral piece', 15000, 800, 150, 25),
    ('RQ-RAW-001', 'Rose Quartz Heart', raw_crystals_id, 'Pink rose quartz heart shape', 2800, 100, 30, 20),
    ('RQ-RAW-002', 'Rose Quartz Palm Stone', raw_crystals_id, 'Tumbled rose quartz palm stone', 1800, 80, 30, 18),
    ('CT-RAW-001', 'Citrine Point', raw_crystals_id, 'Natural citrine, golden yellow', 5500, 200, 50, 22),
    ('BT-RAW-001', 'Black Tourmaline Point', raw_crystals_id, 'Natural black tourmaline, 3-4 inches', 4200, 180, 50, 18);

  -- Insert sample items for Polished Stones
  INSERT INTO items (sku, name, category_id, description, price_crc, current_weight_grams, min_threshold_grams, cost_per_gram) VALUES
    ('CQ-POL-001', 'Clear Quartz Tumbled', polished_id, 'Polished clear quartz, small', 1200, 50, 20, 15),
    ('CQ-POL-002', 'Clear Quartz Tumbled - Large', polished_id, 'Polished clear quartz, large', 2200, 100, 30, 18),
    ('AM-POL-001', 'Amethyst Tumbled', polished_id, 'Polished amethyst, purple', 1800, 60, 20, 22),
    ('RQ-POL-001', 'Rose Quartz Tumbled', polished_id, 'Polished rose quartz, pink', 1500, 50, 20, 20),
    ('AQ-POL-001', 'Aquamarine Tumbled', polished_id, 'Polished aquamarine, blue-green', 3500, 40, 15, 60),
    ('CQ-PND-001', 'Clear Quartz Pendant', polished_id, 'Clear quartz pendant on cord', 2500, 15, 10, 80),
    ('AM-PND-001', 'Amethyst Pendant', polished_id, 'Amethyst pendant on silver chain', 4500, 20, 10, 120);

  -- Insert sample items for Geodes
  INSERT INTO items (sku, name, category_id, description, price_crc, current_weight_grams, min_threshold_grams, cost_per_gram) VALUES
    ('GEO-SM-001', 'Small Amethyst Geode', geodes_id, 'Desktop amethyst geode, 3-4 inches', 5500, 350, 100, 12),
    ('GEO-SM-002', 'Small Clear Quartz Geode', geodes_id, 'Desktop quartz geode', 4200, 300, 100, 10),
    ('GEO-LG-001', 'Large Amethyst Geode', geodes_id, 'Floor amethyst geode, 12+ inches', 25000, 5000, 500, 15),
    ('GEO-MD-001', 'Mediumamethyst Geode', geodes_id, 'Medium amethyst geode, 6-8 inches', 12000, 1500, 200, 12);

  -- Insert sample items for Water Bottles
  INSERT INTO items (sku, name, category_id, description, price_crc, current_weight_grams, min_threshold_grams, cost_per_gram) VALUES
    ('WB-QZ-001', 'Quartz Crystal Water Bottle', water_id, 'Glass bottle with crystal inside', 4500, 500, 100, 5),
    ('WB-AM-001', 'Amethyst Water Bottle', water_id, 'Glass bottle with amethyst', 4500, 500, 100, 8),
    ('WB-RQ-001', 'Rose Quartz Water Bottle', water_id, 'Glass bottle with rose quartz', 4500, 500, 100, 8),
    ('WB-AM-QZ', 'Amethyst & Quartz Combo', water_id, 'Bottle with mixed crystals', 6500, 600, 100, 10);

  -- Insert sample items for Incense
  INSERT INTO items (sku, name, category_id, description, price_crc, current_weight_grams, min_threshold_grams, cost_per_gram) VALUES
    ('INC-PAL-001', 'Palo Santo Sticks', incense_id, 'Bundle of 10 palo santo sticks', 1800, 50, 20, 15),
    ('INC-SAG-001', 'Sage Bundle', incense_id, 'White sage smudge bundle', 2200, 60, 20, 20),
    ('INC-COP-001', 'Copal Incense Cones', incense_id, 'Pack of 10 copal incense cones', 1500, 30, 10, 35),
    ('INC-NAG-001', 'Nag Champa', incense_id, 'Box of 20 nag champa incense', 1200, 40, 15, 20),
    ('INC-MYR-001', 'Myrrh Incense', incense_id, 'Pack of 10 myrrh incense cones', 2000, 25, 10, 50),
    ('INC-CED-001', 'Cedar Incense', incense_id, 'Pack of 15 cedar incense sticks', 1500, 35, 10, 30);

END $$;

-- =============================================================================
-- SECTION 2: SAMPLE BOOKKEEPING ENTRIES
-- Test income and expense entries
-- =============================================================================

INSERT INTO bookkeeping_entries (entry_type, amount_crc, category, description, date) VALUES
  ('income', 15000, 'Crystal Sale', 'Daily crystal sales deposit', CURRENT_DATE),
  ('expense', 3500, 'Supplies', 'Packaging materials', CURRENT_DATE),
  ('expense', 5000, 'Rent', 'Monthly booth rental', CURRENT_DATE - INTERVAL '5 days'),
  ('expense', 12000, 'Supplies', 'Business cards and flyers', CURRENT_DATE - INTERVAL '10 days'),
  ('income', 8500, 'Crystal Sale', 'Previous day sales', CURRENT_DATE - INTERVAL '1 day'),
  ('income', 12000, 'Crystal Sale', 'Previous day sales', CURRENT_DATE - INTERVAL '2 days');

-- =============================================================================
-- SECTION 3: SAMPLE SALES
-- Test sale transactions
-- =============================================================================

DO $$
DECLARE
  vendor_user_id UUID;
BEGIN
  -- Get vendor user ID
  SELECT id INTO vendor_user_id FROM users WHERE role = 'vendor_manager' LIMIT 1;

  -- Insert sample sales
  INSERT INTO sales (sale_date, items_sold, subtotal_crc, tax_crc, total_crc, payment_method, payment_status, created_by_user_id) VALUES
    (NOW() - INTERVAL '2 hours',
      '[{"item_id": "test-1", "sku": "CQ-RAW-001", "name": "Clear Quartz Point - Small", "qty_grams": 150, "price": 2500}]',
      2500, 0, 2500, 'sinpe', 'completed', vendor_user_id),
    (NOW() - INTERVAL '5 hours',
      '[{"item_id": "test-2", "sku": "AM-RAW-001", "name": "Amethyst Point - Small", "qty_grams": 120, "price": 3500}, {"item_id": "test-3", "sku": "INC-PAL-001", "name": "Palo Santo Sticks", "qty_grams": 50, "price": 1800}]',
      5300, 0, 5300, 'cash', 'completed', vendor_user_id),
    (NOW() - INTERVAL '1 day',
      '[{"item_id": "test-4", "sku": "GEO-SM-001", "name": "Small Amethyst Geode", "qty_grams": 350, "price": 5500}]',
      5500, 0, 5500, 'card', 'completed', vendor_user_id);

END $$;

-- =============================================================================
-- SEED DATA COMPLETE
-- =============================================================================
DO $$ 
BEGIN
  RAISE NOTICE 'CrystalPOS seed data inserted successfully!';
  RAISE NOTICE 'Total items: %', (SELECT COUNT(*) FROM items WHERE deleted_at IS NULL);
  RAISE NOTICE 'Total categories: %', (SELECT COUNT(*) FROM categories);
END $$;