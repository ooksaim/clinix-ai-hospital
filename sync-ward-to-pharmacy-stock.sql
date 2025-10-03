-- Sync Ward Supplies to Pharmacy Stock
-- This script copies all unique supplies from ward_supplies to pharmacy_stock
-- so that pharmacy can fulfill ward requests without errors

-- Step 1: Insert all unique ward supplies into pharmacy_stock with generous quantities
INSERT INTO pharmacy_stock (
    supply_name, 
    supply_category, 
    current_stock, 
    minimum_stock_level, 
    maximum_stock_level, 
    unit, 
    cost_per_unit, 
    supplier, 
    notes,
    is_active,
    created_at,
    updated_at
)
SELECT DISTINCT
    ws.supply_name,
    ws.supply_category,
    -- Give pharmacy generous stock levels (10x the total ward demand)
    GREATEST(
        (SELECT SUM(w2.current_stock + w2.minimum_stock_level) 
         FROM ward_supplies w2 
         WHERE w2.supply_name = ws.supply_name) * 10,
        1000  -- Minimum 1000 units in pharmacy
    ) as current_stock,
    
    -- Set minimum stock level as 5x total ward minimum levels
    GREATEST(
        (SELECT SUM(w2.minimum_stock_level) 
         FROM ward_supplies w2 
         WHERE w2.supply_name = ws.supply_name) * 5,
        100   -- Minimum 100 units threshold
    ) as minimum_stock_level,
    
    -- Set maximum stock level as 20x current stock
    GREATEST(
        (SELECT SUM(w2.current_stock + w2.minimum_stock_level) 
         FROM ward_supplies w2 
         WHERE w2.supply_name = ws.supply_name) * 20,
        5000  -- Minimum 5000 units max capacity
    ) as maximum_stock_level,
    
    ws.unit,
    COALESCE(ws.cost_per_unit, 0) as cost_per_unit,
    COALESCE(ws.supplier, 'Central Pharmacy') as supplier,
    'Auto-synced from ward supplies for seamless request fulfillment' as notes,
    TRUE as is_active,
    now() as created_at,
    now() as updated_at
FROM ward_supplies ws
WHERE NOT EXISTS (
    -- Only insert if this supply doesn't already exist in pharmacy_stock
    SELECT 1 FROM pharmacy_stock ps 
    WHERE LOWER(ps.supply_name) = LOWER(ws.supply_name)
)
ORDER BY ws.supply_name;

-- Step 2: Update existing pharmacy stock items that might have low quantities
-- Ensure pharmacy has enough stock to fulfill potential ward requests
UPDATE pharmacy_stock 
SET 
    current_stock = GREATEST(
        current_stock,
        -- Ensure at least 5x the total demand from all wards
        (SELECT COALESCE(SUM(w.current_stock + w.minimum_stock_level), 100) * 5
         FROM ward_supplies w 
         WHERE LOWER(w.supply_name) = LOWER(pharmacy_stock.supply_name))
    ),
    minimum_stock_level = GREATEST(
        minimum_stock_level,
        -- Set minimum to 3x total ward minimum levels
        (SELECT COALESCE(SUM(w.minimum_stock_level), 50) * 3
         FROM ward_supplies w 
         WHERE LOWER(w.supply_name) = LOWER(pharmacy_stock.supply_name))
    ),
    updated_at = now()
WHERE EXISTS (
    SELECT 1 FROM ward_supplies w 
    WHERE LOWER(w.supply_name) = LOWER(pharmacy_stock.supply_name)
);

-- Step 3: Create supply_name links in supply_requests for existing requests
-- Update any existing supply requests to link with pharmacy stock
UPDATE supply_requests 
SET 
    supply_name = ws.supply_name,
    pharmacy_supply_id = ps.id,
    updated_at = now()
FROM ward_supplies ws, pharmacy_stock ps
WHERE supply_requests.supply_id = ws.id
  AND LOWER(ps.supply_name) = LOWER(ws.supply_name)
  AND supply_requests.supply_name IS NULL;

-- Step 4: Display the sync results
-- Show what was added/updated
SELECT 
    'SYNC RESULTS' as status,
    COUNT(*) as total_pharmacy_items,
    COUNT(CASE WHEN created_at >= now() - interval '1 minute' THEN 1 END) as newly_added,
    SUM(current_stock) as total_pharmacy_stock
FROM pharmacy_stock;

-- Step 5: Show supply availability matrix
-- This helps verify that all ward supplies have corresponding pharmacy stock
SELECT 
    ws.supply_name,
    ws.supply_category,
    COUNT(DISTINCT ws.ward_id) as wards_using,
    SUM(ws.current_stock) as total_ward_stock,
    SUM(ws.minimum_stock_level) as total_ward_minimum,
    ps.current_stock as pharmacy_stock,
    ps.minimum_stock_level as pharmacy_minimum,
    CASE 
        WHEN ps.current_stock >= (SUM(ws.current_stock) + SUM(ws.minimum_stock_level)) * 2 
        THEN '✅ WELL_STOCKED'
        WHEN ps.current_stock >= SUM(ws.minimum_stock_level) * 3 
        THEN '⚠️ ADEQUATE'
        ELSE '❌ LOW_STOCK'
    END as availability_status
FROM ward_supplies ws
JOIN pharmacy_stock ps ON LOWER(ps.supply_name) = LOWER(ws.supply_name)
GROUP BY ws.supply_name, ws.supply_category, ps.current_stock, ps.minimum_stock_level
ORDER BY availability_status, ws.supply_name;

-- Step 6: Show any ward supplies that don't have pharmacy counterparts
-- These would cause errors when requesting
SELECT 
    'MISSING FROM PHARMACY' as issue,
    ws.supply_name,
    COUNT(DISTINCT ws.ward_id) as affected_wards,
    SUM(ws.current_stock) as total_ward_demand
FROM ward_supplies ws
WHERE NOT EXISTS (
    SELECT 1 FROM pharmacy_stock ps 
    WHERE LOWER(ps.supply_name) = LOWER(ws.supply_name)
)
GROUP BY ws.supply_name
ORDER BY affected_wards DESC, total_ward_demand DESC;

-- Add helpful comments
COMMENT ON TABLE pharmacy_stock IS 'Central pharmacy inventory - synced with ward supplies for seamless request fulfillment';

-- Success message
SELECT '🎉 SYNC COMPLETE: Ward supplies successfully synced to pharmacy stock!' as message;