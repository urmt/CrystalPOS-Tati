-- =============================================================================
-- ADD last_sold_at COLUMN TO ITEMS
-- Track when item was last sold for depletion rate calculation
-- =============================================================================

ALTER TABLE items ADD COLUMN IF NOT EXISTS last_sold_at TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- CREATE FUNCTION TO CALCULATE DEPLETION RATE FROM SALES
-- Only considers periods when item was actually in stock
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_depletion_rate(p_item_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_depletion_rate NUMERIC := 0;
  v_total_sold NUMERIC := 0;
  v_days_active NUMERIC := 0;
  v_last_restock TIMESTAMP WITH TIME ZONE;
  v_first_sale TIMESTAMP WITH TIME ZONE;
  v_item_stock NUMERIC;
BEGIN
  -- Get current stock
  SELECT current_weight_grams INTO v_item_stock 
  FROM items WHERE id = p_item_id;
  
  IF v_item_stock IS NULL OR v_item_stock <= 0 THEN
    RETURN 0; -- No stock
  END IF;
  
  -- Get last restock time (when inventory went up from low/empty)
  SELECT MAX(created_at) INTO v_last_restock
  FROM inventory_transactions
  WHERE item_id = p_item_id 
    AND quantity_grams > 0
    AND transaction_type IN ('restock', 'adjustment');
  
  -- Get first sale after last restock
  SELECT MIN(s.sale_date) INTO v_first_sale
  FROM sales s,
    LATERAL unnest(s.items_sold) AS item(item_id, qty_grams)
  WHERE item.item_id = p_item_id
    AND s.sale_date > COALESCE(v_last_restock, '1970-01-01'::timestamp);
  
  IF v_first_sale IS NULL THEN
    RETURN 0; -- Never sold
  END IF;
  
  -- Calculate days since first sale (excluding when out of stock)
  v_days_active := GREATEST(1, EXTRACT(EPOCH FROM (NOW() - v_first_sale)) / 86400);
  
  -- Get total sold since first sale
  SELECT COALESCE(SUM(item.qty_grams), 0) INTO v_total_sold
  FROM sales s,
    LATERAL unnest(s.items_sold) AS item(item_id, qty_grams)
  WHERE item.item_id = p_item_id
    AND s.sale_date >= v_first_sale;
  
  -- Calculate rate: grams per day
  v_depletion_rate := v_total_sold / v_days_active;
  
  UPDATE items 
  SET depletion_rate_grams_per_day = v_depletion_rate,
      last_sold_at = v_first_sale
  WHERE id = p_item_id;
  
  RETURN v_depletion_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- UPDATE ALL ITEMS DEPLETION RATES
-- Run this to populate initial rates for all items
-- =============================================================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM items LOOP
    PERFORM calculate_depletion_rate(rec.id);
  END LOOP;
END $$;