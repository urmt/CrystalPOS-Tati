-- =============================================================================
-- CONSOLIDATED MIGRATION - Bilingual Fields, Price Fields, and Test Data
-- Crystal Tati POS System
-- Run this ONE TIME in Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- STEP 1: Add Bilingual Fields (Spanish)
-- =============================================================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_es TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_es TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS name_es TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS description_es TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS name_es TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS description_es TEXT;

-- =============================================================================
-- STEP 2: Add Price and Discount Fields
-- =============================================================================
ALTER TABLE items ADD COLUMN IF NOT EXISTS suggested_price_crc NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_crc NUMERIC DEFAULT 0;

-- =============================================================================
-- STEP 3: Create 4 Categories (IDs will be auto-generated)
-- =============================================================================
INSERT INTO categories (name, name_es, description, display_order, is_active, created_at, updated_at) VALUES
('Crystals / Cristales', 'Cristales', 'Clusters, Points, Formations', 1, true, NOW(), NOW()),
('Minerals / Minerales', 'Minerales', 'Tumbled and Polished Stones', 2, true, NOW(), NOW()),
('Healing Stones / Piedras Curativas', 'Piedras Curativas', 'Chakra sets and Healing crystals', 3, true, NOW(), NOW()),
('Unique / Único', 'Único', 'Rare and Collectible pieces', 4, true, NOW(), NOW());

-- =============================================================================
-- STEP 4: Create 8 Subcategories
-- =============================================================================
INSERT INTO subcategories (category_id, name, name_es, display_order, is_active, created_at, updated_at)
SELECT c.id, 'Clusters', 'Conjuntos', 1, true, NOW(), NOW() FROM categories c WHERE c.name LIKE '%Crystals%' LIMIT 1
UNION ALL
SELECT c.id, 'Points', 'Puntas', 2, true, NOW(), NOW() FROM categories c WHERE c.name LIKE '%Crystals%' LIMIT 1
UNION ALL
SELECT c.id, 'Tumbled', 'Pulidos', 1, true, NOW(), NOW() FROM categories c WHERE c.name LIKE '%Minerals%' LIMIT 1
UNION ALL
SELECT c.id, 'Polished', 'Tallados', 2, true, NOW(), NOW() FROM categories c WHERE c.name LIKE '%Minerals%' LIMIT 1
UNION ALL
SELECT c.id, 'Chakra Sets', 'Conjuntos Chakra', 1, true, NOW(), NOW() FROM categories c WHERE c.name LIKE '%Healing%' LIMIT 1
UNION ALL
SELECT c.id, 'Healing', 'Curación', 2, true, NOW(), NOW() FROM categories c WHERE c.name LIKE '%Healing%' LIMIT 1
UNION ALL
SELECT c.id, 'Rare', 'Raro', 1, true, NOW(), NOW() FROM categories c WHERE c.name LIKE '%Unique%' LIMIT 1
UNION ALL
SELECT c.id, 'Collectible', 'Coleccionable', 2, true, NOW(), NOW() FROM categories c WHERE c.name LIKE '%Unique%' LIMIT 1;

-- =============================================================================
-- STEP 5: Create 9 Test Items (prices in CRC per gram)
-- =============================================================================
INSERT INTO items (sku, name, name_es, category_id, subcategory_id, description, cost_per_gram, suggested_price_crc, price_crc, current_weight_grams, min_threshold_grams, is_active, created_at, updated_at)
SELECT * FROM (
  -- Crystal items (using first subcategory 'Clusters')
  SELECT 'AML-CLUS-001', 'Amethyst Cluster', 'Conjunto de Amatista', 
    (SELECT id FROM categories WHERE name LIKE '%Crystals%' LIMIT 1),
    (SELECT id FROM subcategories WHERE name = 'Clusters' LIMIT 1),
    'Beautiful Brazilian amethyst cluster with dark purple points', 780, 1550, 1200, 500, 50, true, NOW(), NOW()
  UNION ALL
  SELECT 'CIT-CLUS-001', 'Citrine Cluster', 'Conjunto de Citrino',
    (SELECT id FROM categories WHERE name LIKE '%Crystals%' LIMIT 1),
    (SELECT id FROM subcategories WHERE name = 'Clusters' LIMIT 1),
    'Natural citrine cluster from Brazil - sunny yellow', 1150, 2450, 2000, 300, 30, true, NOW(), NOW()
  UNION ALL
  SELECT 'AML-POINT-001', 'Amethyst Point', 'Punta de Amatista',
    (SELECT id FROM categories WHERE name LIKE '%Crystals%' LIMIT 1),
    (SELECT id FROM subcategories WHERE name = 'Points' LIMIT 1),
    'Single standing amethyst point - great for altar', 950, 1950, 1800, 200, 20, true, NOW(), NOW()
  UNION ALL
  -- Mineral items
  SELECT 'RQ-TUMB-001', 'Rose Quartz Tumbled', 'Cuarzo Rosa Pulido',
    (SELECT id FROM categories WHERE name LIKE '%Minerals%' LIMIT 1),
    (SELECT id FROM subcategories WHERE name = 'Tumbled' LIMIT 1),
    'Classic soft pink rose quartz - love stone', 580, 1150, 1000, 400, 50, true, NOW(), NOW()
  UNION ALL
  SELECT 'CQ-TUMB-001', 'Clear Quartz Tumbled', 'Cuarzo Transparente Pulido',
    (SELECT id FROM categories WHERE name LIKE '%Minerals%' LIMIT 1),
    (SELECT id FROM subcategories WHERE name = 'Tumbled' LIMIT 1),
    'Clear quartz - the universal healer', 390, 780, 650, 600, 75, true, NOW(), NOW()
  UNION ALL
  SELECT 'SQ-TUMB-001', 'Smoky Quartz Tumbled', 'Cuarzo Ahumado Pulido',
    (SELECT id FROM categories WHERE name LIKE '%Minerals%' LIMIT 1),
    (SELECT id FROM subcategories WHERE name = 'Tumbled' LIMIT 1),
    'Natural brown smoky quartz - grounding energy', 680, 1350, 1100, 350, 40, true, NOW(), NOW()
  UNION ALL
  -- Healing items
  SELECT '7CH-MIX-001', 'Mixed 7 Chakra Stones', 'Mezcla 7 Piedras Chakra',
    (SELECT id FROM categories WHERE name LIKE '%Healing%' LIMIT 1),
    (SELECT id FROM subcategories WHERE name = 'Chakra Sets' LIMIT 1),
    '7 different colored stones for chakra balancing', 480, 980, 850, 200, 25, true, NOW(), NOW()
  UNION ALL
  SELECT 'BT-TUMB-001', 'Black Tourmaline Tumbled', 'Turmalina Negra Pulida',
    (SELECT id FROM categories WHERE name LIKE '%Healing%' LIMIT 1),
    (SELECT id FROM subcategories WHERE name = 'Healing' LIMIT 1),
    'Powerful protection stone - shields EMF', 880, 1750, 1500, 150, 20, true, NOW(), NOW()
  UNION ALL
  -- Unique items
  SELECT 'PUR-CATH-001', 'Purple Cathedral Formation', 'Formación Catedral Púrpura',
    (SELECT id FROM categories WHERE name LIKE '%Unique%' LIMIT 1),
    (SELECT id FROM subcategories WHERE name = 'Rare' LIMIT 1),
    'RARE! Large purple amethyst cathedral formation - museum quality piece', 2850, 7800, 6500, 50, 5, true, NOW(), NOW()
) AS data(sku, name, name_es, category_id, subcategory_id, description, cost_per_gram, suggested_price_crc, price_crc, current_weight_grams, min_threshold_grams, is_active, created_at, updated_at);

-- =============================================================================
-- STEP 6: Verify
-- =============================================================================
SELECT 'Categories created:' as info, COUNT(*) as count FROM categories WHERE name LIKE '%Crystals%';
SELECT 'Subcategories created:' as info, COUNT(*) as count FROM subcategories;
SELECT 'Items created:' as info, COUNT(*) as count FROM items WHERE sku LIKE 'AML-%' OR sku LIKE 'CIT-%';