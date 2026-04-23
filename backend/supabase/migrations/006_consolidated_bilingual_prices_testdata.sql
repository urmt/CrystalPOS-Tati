-- =============================================================================
-- CONSOLIDATED MIGRATION - With Real Crystal Images
-- Run this in Supabase SQL Editor
-- =============================================================================

-- STEP 1: Add Bilingual Fields
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_es TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_es TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS name_es TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS description_es TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS name_es TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS description_es TEXT;

-- STEP 2: Add Price Fields
ALTER TABLE items ADD COLUMN IF NOT EXISTS suggested_price_crc NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_crc NUMERIC DEFAULT 0;

-- STEP 3: Create 4 Categories
INSERT INTO categories (name, name_es, description, display_order, is_active) VALUES
('Crystals / Cristales', 'Cristales', 'Clusters, Points, Formations', 1, true),
('Minerals / Minerales', 'Minerales', 'Tumbled and Polished Stones', 2, true),
('Healing Stones / Piedras Curativas', 'Piedras Curativas', 'Chakra sets', 3, true),
('Unique / Único', 'Único', 'Rare and Collectible pieces', 4, true);

-- STEP 4: Create 8 Subcategories
INSERT INTO subcategories (category_id, name, name_es, display_order, is_active) SELECT c.id, 'Clusters', 'Conjuntos', 1, true FROM categories c WHERE c.name LIKE '%Crystals%' LIMIT 1;
INSERT INTO subcategories (category_id, name, name_es, display_order, is_active) SELECT c.id, 'Points', 'Puntas', 2, true FROM categories c WHERE c.name LIKE '%Crystals%' LIMIT 1;
INSERT INTO subcategories (category_id, name, name_es, display_order, is_active) SELECT c.id, 'Tumbled', 'Pulidos', 1, true FROM categories c WHERE c.name LIKE '%Minerals%' LIMIT 1;
INSERT INTO subcategories (category_id, name, name_es, display_order, is_active) SELECT c.id, 'Polished', 'Tallados', 2, true FROM categories c WHERE c.name LIKE '%Minerals%' LIMIT 1;
INSERT INTO subcategories (category_id, name, name_es, display_order, is_active) SELECT c.id, 'Chakra Sets', 'Conjuntos Chakra', 1, true FROM categories c WHERE c.name LIKE '%Healing%' LIMIT 1;
INSERT INTO subcategories (category_id, name, name_es, display_order, is_active) SELECT c.id, 'Healing', 'Curación', 2, true FROM categories c WHERE c.name LIKE '%Healing%' LIMIT 1;
INSERT INTO subcategories (category_id, name, name_es, display_order, is_active) SELECT c.id, 'Rare', 'Raro', 1, true FROM categories c WHERE c.name LIKE '%Unique%' LIMIT 1;
INSERT INTO subcategories (category_id, name, name_es, display_order, is_active) SELECT c.id, 'Collectible', 'Coleccionable', 2, true FROM categories c WHERE c.name LIKE '%Unique%' LIMIT 1;

-- STEP 5: Create 6 Test Items with Real Crystal Images
INSERT INTO items (sku, name, name_es, category_id, subcategory_id, description, cost_per_gram, suggested_price_crc, price_crc, current_weight_grams, min_threshold_grams, is_active, image_url) VALUES
('AML-CLUS-001', 'Amethyst Cluster', 'Conjunto de Amatista', 
  (SELECT id FROM categories WHERE name LIKE '%Crystals%' LIMIT 1),
  (SELECT id FROM subcategories WHERE name = 'Clusters' LIMIT 1),
  'Beautiful Brazilian amethyst cluster with dark purple points', 780, 1550, 1200, 500, 50, true,
  'https://images.unsplash.com/photo-1566933294864-7c1c0e5a8d4c?w=800&q=80');

INSERT INTO items (sku, name, name_es, category_id, subcategory_id, description, cost_per_gram, suggested_price_crc, price_crc, current_weight_grams, min_threshold_grams, is_active, image_url) VALUES
('CIT-CLUS-001', 'Citrine Cluster', 'Conjunto de Citrino',
  (SELECT id FROM categories WHERE name LIKE '%Crystals%' LIMIT 1),
  (SELECT id FROM subcategories WHERE name = 'Clusters' LIMIT 1),
  'Natural citrine cluster from Brazil - sunny yellow', 1150, 2450, 2000, 300, 30, true,
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80');

INSERT INTO items (sku, name, name_es, category_id, subcategory_id, description, cost_per_gram, suggested_price_crc, price_crc, current_weight_grams, min_threshold_grams, is_active, image_url) VALUES
('RQ-TUMB-001', 'Rose Quartz Tumbled', 'Cuarzo Rosa Pulido',
  (SELECT id FROM categories WHERE name LIKE '%Minerals%' LIMIT 1),
  (SELECT id FROM subcategories WHERE name = 'Tumbled' LIMIT 1),
  'Classic soft pink rose quartz - love stone', 580, 1150, 1000, 400, 50, true,
  'https://images.unsplash.com/photo-1618423696803-12d8a4e8d25d?w=800&q=80');

INSERT INTO items (sku, name, name_es, category_id, subcategory_id, description, cost_per_gram, suggested_price_crc, price_crc, current_weight_grams, min_threshold_grams, is_active, image_url) VALUES
('CQ-TUMB-001', 'Clear Quartz Tumbled', 'Cuarzo Transparente Pulido',
  (SELECT id FROM categories WHERE name LIKE '%Minerals%' LIMIT 1),
  (SELECT id FROM subcategories WHERE name = 'Tumbled' LIMIT 1),
  'Clear quartz - the universal healer', 390, 780, 650, 600, 75, true,
  'https://images.unsplash.com/photo-1622648253794-d98c64f89286?w=800&q=80');

INSERT INTO items (sku, name, name_es, category_id, subcategory_id, description, cost_per_gram, suggested_price_crc, price_crc, current_weight_grams, min_threshold_grams, is_active, image_url) VALUES
('7CH-MIX-001', 'Mixed 7 Chakra Stones', 'Mezcla 7 Piedras Chakra',
  (SELECT id FROM categories WHERE name LIKE '%Healing%' LIMIT 1),
  (SELECT id FROM subcategories WHERE name = 'Chakra Sets' LIMIT 1),
  '7 different colored stones for chakra balancing', 480, 980, 850, 200, 25, true,
  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80');

INSERT INTO items (sku, name, name_es, category_id, subcategory_id, description, cost_per_gram, suggested_price_crc, price_crc, current_weight_grams, min_threshold_grams, is_active, image_url) VALUES
('PUR-CATH-001', 'Purple Cathedral Formation', 'Formación Catedral Púrpura',
  (SELECT id FROM categories WHERE name LIKE '%Unique%' LIMIT 1),
  (SELECT id FROM subcategories WHERE name = 'Rare' LIMIT 1),
  'RARE! Large purple amethyst cathedral formation - museum quality', 2850, 7800, 6500, 50, 5, true,
  'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=800&q=80');

-- Verify
SELECT 'Categories:' as info, COUNT(*) as count FROM categories;
SELECT 'Subcategories:' as info, COUNT(*) as count FROM subcategories;
SELECT 'Items:' as info, COUNT(*) as count FROM items;
SELECT 'Items with images:' as info, COUNT(*) as count FROM items WHERE image_url IS NOT NULL;