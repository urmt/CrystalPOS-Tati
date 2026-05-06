-- Add subcategory_ids to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS subcategory_ids text[] DEFAULT ARRAY[]::text[];