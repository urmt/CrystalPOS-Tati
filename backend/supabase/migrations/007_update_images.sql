-- =============================================================================
-- UPDATE ITEMS WITH IMAGES
-- Run this to add images to existing items
-- =============================================================================

-- Update items with crystal images (will work even if items exist)
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1566933294864-7c1c0e5a8d4c?w=800&q=80' WHERE sku = 'AML-CLUS-001';
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80' WHERE sku = 'CIT-CLUS-001';
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1618423696803-12d8a4e8d25d?w=800&q=80' WHERE sku = 'RQ-TUMB-001';
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1622648253794-d98c64f89286?w=800&q=80' WHERE sku = 'CQ-TUMB-001';
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80' WHERE sku = '7CH-MIX-001';
UPDATE items SET image_url = 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=800&q=80' WHERE sku = 'PUR-CATH-001';

-- Add Spanish names if not present
UPDATE items SET name_es = 'Conjunto de Amatista' WHERE sku = 'AML-CLUS-001' AND (name_es IS NULL OR name_es = '');
UPDATE items SET name_es = 'Conjunto de Citrino' WHERE sku = 'CIT-CLUS-001' AND (name_es IS NULL OR name_es = '');
UPDATE items SET name_es = 'Cuarzo Rosa Pulido' WHERE sku = 'RQ-TUMB-001' AND (name_es IS NULL OR name_es = '');
UPDATE items SET name_es = 'Cuarzo Transparente Pulido' WHERE sku = 'CQ-TUMB-001' AND (name_es IS NULL OR name_es = '');
UPDATE items SET name_es = 'Mezcla 7 Piedras Chakra' WHERE sku = '7CH-MIX-001' AND (name_es IS NULL OR name_es = '');
UPDATE items SET name_es = 'Formación Catedral Púrpura' WHERE sku = 'PUR-CATH-001' AND (name_es IS NULL OR name_es = '');

-- Verify
SELECT name, sku, image_url FROM items WHERE sku LIKE 'AML-%' OR sku LIKE 'CIT-%' OR sku LIKE 'RQ-%';