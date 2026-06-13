-- Migration 014: Seed the full 3-level category hierarchy
-- Idempotent: safe to run multiple times without creating duplicates

DO $$
DECLARE
  cat_id UUID;
  sub_id UUID;
BEGIN

  -- =========================================================================
  -- 1. POLISHED POINTS
  -- =========================================================================
  SELECT id INTO cat_id FROM categories WHERE name = 'Polished Points' LIMIT 1;
  IF cat_id IS NULL THEN
    INSERT INTO categories (name, name_es, description, description_es, display_order)
    VALUES ('Polished Points', 'Puntos Pulidos', 'Polished crystal points', 'Puntos de cristal pulidos', 1)
    RETURNING id INTO cat_id;
  END IF;

  -- Quartz
  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Quartz' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Quartz', 'Cuarzo', 1) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  -- Rose
  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Rose' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Rose', 'Rosa', 2) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  -- Amethyst
  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Amethyst' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Amethyst', 'Amatista', 3) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  -- Citrine
  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Citrine' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Citrine', 'Citrino', 4) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  -- =========================================================================
  -- 2. NATURAL POINTS
  -- =========================================================================
  SELECT id INTO cat_id FROM categories WHERE name = 'Natural Points' LIMIT 1;
  IF cat_id IS NULL THEN
    INSERT INTO categories (name, name_es, description, description_es, display_order)
    VALUES ('Natural Points', 'Puntos Naturales', 'Unpolished natural crystal points', 'Puntos de cristal natural sin pulir', 2)
    RETURNING id INTO cat_id;
  END IF;

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Quartz' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Quartz', 'Cuarzo', 1) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Rose' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Rose', 'Rosa', 2) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Amethyst' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Amethyst', 'Amatista', 3) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Citrine' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Citrine', 'Citrino', 4) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  -- =========================================================================
  -- 3. INCENSE
  -- =========================================================================
  SELECT id INTO cat_id FROM categories WHERE name = 'Incense' LIMIT 1;
  IF cat_id IS NULL THEN
    INSERT INTO categories (name, name_es, description, description_es, display_order)
    VALUES ('Incense', 'Incienso', 'Incense sticks and cones', 'Varas y conos de incienso', 3)
    RETURNING id INTO cat_id;
  END IF;

  -- Cone (no sub-subcategories)
  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Cone' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Cone', 'Cono', 1) RETURNING id INTO sub_id;
  END IF;

  -- Stick (no sub-subcategories)
  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Stick' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Stick', 'Vara', 2) RETURNING id INTO sub_id;
  END IF;

  -- =========================================================================
  -- 4. CLUSTER
  -- =========================================================================
  SELECT id INTO cat_id FROM categories WHERE name = 'Cluster' LIMIT 1;
  IF cat_id IS NULL THEN
    INSERT INTO categories (name, name_es, description, description_es, display_order)
    VALUES ('Cluster', 'Cluster', 'Crystal clusters', 'Clústers de cristal', 4)
    RETURNING id INTO cat_id;
  END IF;

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Quartz' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Quartz', 'Cuarzo', 1) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Rose' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Rose', 'Rosa', 2) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Amethyst' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Amethyst', 'Amatista', 3) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Citrine' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Citrine', 'Citrino', 4) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  -- =========================================================================
  -- 5. PRECIOUS STONES
  -- =========================================================================
  SELECT id INTO cat_id FROM categories WHERE name = 'Precious Stones' LIMIT 1;
  IF cat_id IS NULL THEN
    INSERT INTO categories (name, name_es, description, description_es, display_order)
    VALUES ('Precious Stones', 'Piedras Preciosas', 'Precious and semi-precious stones', 'Piedras preciosas y semipreciosas', 5)
    RETURNING id INTO cat_id;
  END IF;

  -- 7Shakra
  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = '7Shakra' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, '7Shakra', '7Chakras', 1) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  -- Onyx
  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Onyx' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Onyx', 'Ónix', 2) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  -- =========================================================================
  -- 6. TOWERS
  -- =========================================================================
  SELECT id INTO cat_id FROM categories WHERE name = 'Towers' LIMIT 1;
  IF cat_id IS NULL THEN
    INSERT INTO categories (name, name_es, description, description_es, display_order)
    VALUES ('Towers', 'Torres', 'Crystal towers and obelisks', 'Torres y obeliscos de cristal', 6)
    RETURNING id INTO cat_id;
  END IF;

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Quartz' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Quartz', 'Cuarzo', 1) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Rose' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Rose', 'Rosa', 2) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Amethyst' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Amethyst', 'Amatista', 3) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Citrine' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Citrine', 'Citrino', 4) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  -- =========================================================================
  -- 7. CARVED CRYSTALS
  -- =========================================================================
  SELECT id INTO cat_id FROM categories WHERE name = 'Carved Crystals' LIMIT 1;
  IF cat_id IS NULL THEN
    INSERT INTO categories (name, name_es, description, description_es, display_order)
    VALUES ('Carved Crystals', 'Cristales Tallados', 'Hand-carved crystal figures', 'Figuras talladas a mano en cristal', 7)
    RETURNING id INTO cat_id;
  END IF;

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Quartz' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Quartz', 'Cuarzo', 1) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Mushroom', 'Hongo', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Mushroom');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Wand', 'Varita', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Wand');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Orb', 'Esfera', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Orb');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Rose' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Rose', 'Rosa', 2) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Mushroom', 'Hongo', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Mushroom');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Wand', 'Varita', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Wand');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Orb', 'Esfera', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Orb');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Amethyst' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Amethyst', 'Amatista', 3) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Mushroom', 'Hongo', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Mushroom');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Wand', 'Varita', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Wand');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Orb', 'Esfera', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Orb');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Citrine' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Citrine', 'Citrino', 4) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Mushroom', 'Hongo', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Mushroom');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Wand', 'Varita', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Wand');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Orb', 'Esfera', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Orb');

  -- =========================================================================
  -- 8. CATHEDRALS-GEODES
  -- =========================================================================
  SELECT id INTO cat_id FROM categories WHERE name = 'Cathedrals-Geodes' LIMIT 1;
  IF cat_id IS NULL THEN
    INSERT INTO categories (name, name_es, description, description_es, display_order)
    VALUES ('Cathedrals-Geodes', 'Catedrales-Geodas', 'Crystal cathedrals and geode specimens', 'Catedrales de cristal y especímenes de geoda', 8)
    RETURNING id INTO cat_id;
  END IF;

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Quartz' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Quartz', 'Cuarzo', 1) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Rose' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Rose', 'Rosa', 2) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Amethyst' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Amethyst', 'Amatista', 3) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Citrine' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Citrine', 'Citrino', 4) RETURNING id INTO sub_id;
  END IF;
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Large', 'Grande', 1 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Large');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Medium', 'Mediano', 2 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Medium');
  INSERT INTO sub_subcategories (subcategory_id, name, name_es, display_order) SELECT sub_id, 'Small', 'Pequeño', 3 WHERE NOT EXISTS (SELECT 1 FROM sub_subcategories WHERE subcategory_id = sub_id AND name = 'Small');

  -- =========================================================================
  -- 9. WATER BOTTLES (standalone - no subcategories)
  -- =========================================================================
  SELECT id INTO cat_id FROM categories WHERE name = 'Water Bottles' LIMIT 1;
  IF cat_id IS NULL THEN
    INSERT INTO categories (name, name_es, description, description_es, display_order)
    VALUES ('Water Bottles', 'Botellas de Agua', 'Crystal-infused water bottles', 'Botellas de agua con cristal', 9)
    RETURNING id INTO cat_id;
  END IF;

  -- =========================================================================
  -- 10. UNIQUE ITEMS (standalone - no subcategories)
  -- =========================================================================
  SELECT id INTO cat_id FROM categories WHERE name = 'Unique Items' LIMIT 1;
  IF cat_id IS NULL THEN
    INSERT INTO categories (name, name_es, description, description_es, display_order)
    VALUES ('Unique Items', 'Artículos Únicos', 'One-of-a-kind unique items', 'Artículos únicos de una sola pieza', 10)
    RETURNING id INTO cat_id;
  END IF;

  -- =========================================================================
  -- 11. TOURNAMENT SMART CHESS BOARD
  -- =========================================================================
  SELECT id INTO cat_id FROM categories WHERE name = 'Tournament Smart Chess Board' LIMIT 1;
  IF cat_id IS NULL THEN
    INSERT INTO categories (name, name_es, description, description_es, display_order)
    VALUES ('Tournament Smart Chess Board', 'Tablero de Ajedrez Inteligente', 'Smart chess boards with crystal pieces', 'Tableros de ajedrez inteligentes con piezas de cristal', 11)
    RETURNING id INTO cat_id;
  END IF;

  -- Crystal type subcategories for chess boards (no sub-subcategories)
  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Quartz' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Quartz', 'Cuarzo', 1) RETURNING id INTO sub_id;
  END IF;

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Rose' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Rose', 'Rosa', 2) RETURNING id INTO sub_id;
  END IF;

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Amethyst' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Amethyst', 'Amatista', 3) RETURNING id INTO sub_id;
  END IF;

  SELECT id INTO sub_id FROM subcategories WHERE category_id = cat_id AND name = 'Citrine' LIMIT 1;
  IF sub_id IS NULL THEN
    INSERT INTO subcategories (category_id, name, name_es, display_order) VALUES (cat_id, 'Citrine', 'Citrino', 4) RETURNING id INTO sub_id;
  END IF;

END $$;
