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
-- STEP 3: Create Categories
-- =============================================================================
INSERT INTO categories (id, name, name_es, description, display_order, is_active, created_at, updated_at) VALUES
('cat-test-crystals', 'Crystals / Cristales', 'Cristales', 'Clusters, Points, Formations', 1, true, NOW(), NOW()),
('cat-test-minerals', 'Minerals / Minerales', 'Minerales', 'Tumbled and Polished Stones', 2, true, NOW(), NOW()),
('cat-test-healing', 'Healing Stones / Piedras Curativas', 'Piedras Curativas', 'Chakra sets and Healing crystals', 3, true, NOW(), NOW()),
('cat-test-unique', 'Unique / Único', 'Único', 'Rare and Collectible pieces', 4, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 4: Create Subcategories
-- =============================================================================
INSERT INTO subcategories (id, category_id, name, name_es, display_order, is_active, created_at, updated_at) VALUES
('sub-clusters', 'cat-test-crystals', 'Clusters', 'Conjuntos', 1, true, NOW(), NOW()),
('sub-points', 'cat-test-crystals', 'Points', 'Puntas', 2, true, NOW(), NOW()),
('sub-tumbled', 'cat-test-minerals', 'Tumbled', 'Pulidos', 1, true, NOW(), NOW()),
('sub-polished', 'cat-test-minerals', 'Polished', 'Tallados', 2, true, NOW(), NOW()),
('sub-chakra', 'cat-test-healing', 'Chakra Sets', 'Conjuntos Chakra', 1, true, NOW(), NOW()),
('sub-healing', 'cat-test-healing', 'Healing', 'Curación', 2, true, NOW(), NOW()),
('sub-rare', 'cat-test-unique', 'Rare', 'Raro', 1, true, NOW(), NOW()),
('sub-collectible', 'cat-test-unique', 'Collectible', 'Coleccionable', 2, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 5: Create Inventory Items (all prices in CRC per gram)
-- =============================================================================
INSERT INTO items (id, sku, name, name_es, category_id, subcategory_id, description, cost_per_gram, suggested_price_crc, price_crc, current_weight_grams, min_threshold_grams, is_active, created_at, updated_at) VALUES
-- Crystals
('item-001', 'AML-CLUS-001', 'Amethyst Cluster', 'Conjunto de Amatista', 'cat-test-crystals', 'sub-clusters', 'Beautiful Brazilian amethyst cluster with dark purple points', 780, 1550, 1200, 500, 50, true, NOW(), NOW()),
('item-002', 'CIT-CLUS-001', 'Citrine Cluster', 'Conjunto de Citrino', 'cat-test-crystals', 'sub-clusters', 'Natural citrine cluster from Brazil - sunny yellow', 1150, 2450, 2000, 300, 30, true, NOW(), NOW()),
('item-003', 'AML-POINT-001', 'Amethyst Point', 'Punta de Amatista', 'cat-test-crystals', 'sub-points', 'Single standing amethyst point - great for altar', 950, 1950, 1800, 200, 20, true, NOW(), NOW()),
-- Minerals
('item-004', 'RQ-TUMB-001', 'Rose Quartz Tumbled', 'Cuarzo Rosa Pulido', 'cat-test-minerals', 'sub-tumbled', 'Classic soft pink rose quartz - love stone', 580, 1150, 1000, 400, 50, true, NOW(), NOW()),
('item-005', 'CQ-TUMB-001', 'Clear Quartz Tumbled', 'Cuarzo Transparente Pulido', 'cat-test-minerals', 'sub-tumbled', 'Clear quartz - the universal healer', 390, 780, 650, 600, 75, true, NOW(), NOW()),
('item-006', 'SQ-TUMB-001', 'Smoky Quartz Tumbled', 'Cuarzo Ahumado Pulido', 'cat-test-minerals', 'sub-tumbled', 'Natural brown smoky quartz - grounding energy', 680, 1350, 1100, 350, 40, true, NOW(), NOW()),
-- Healing Stones
('item-007', '7CH-MIX-001', 'Mixed 7 Chakra Stones', 'Mezcla 7 Piedras Chakra', 'cat-test-healing', 'sub-chakra', '7 different colored stones for chakra balancing', 480, 980, 850, 200, 25, true, NOW(), NOW()),
('item-008', 'BT-TUMB-001', 'Black Tourmaline Tumbled', 'Turmalina Negra Pulida', 'cat-test-healing', 'sub-healing', 'Powerful protection stone - shields EMF', 880, 1750, 1500, 150, 20, true, NOW(), NOW()),
-- Unique
('item-009', 'PUR-CATH-001', 'Purple Cathedral Formation', 'Formación Catedral Púrpura', 'cat-test-unique', 'sub-rare', 'RARE! Large purple amethyst cathedral formation - museum quality piece', 2850, 7800, 6500, 50, 5, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 6: Verify
-- =============================================================================
SELECT 'Categories created:' as info, COUNT(*) as count FROM categories WHERE name LIKE '%Test%' OR name LIKE '%Cristales%';
SELECT 'Subcategories created:' as info, COUNT(*) as count FROM subcategories WHERE category_id IN (SELECT id FROM categories WHERE name LIKE '%Test%');
SELECT 'Items created:' as info, COUNT(*) as count FROM items WHERE sku LIKE 'AML-%' OR sku LIKE 'CIT-%' OR sku LIKE 'RQ-%';