/*
  # Add selling-related fields to clothing_items table
  
  1. New Fields
    - `original_price` (decimal, nullable) - The price originally paid for the item
    - `current_value` (decimal, nullable) - Estimated current market value
    - `selling_price` (decimal, nullable) - Price at which user wants to sell
    - `condition` (enum) - Current condition of the item
    - `is_for_sale` (boolean, default false) - Whether item is currently listed for sale
    - `sale_listing` (jsonb, nullable) - Additional selling details
  
  2. Create enum for item condition
*/

-- Create enum for item condition
CREATE TYPE item_condition AS ENUM (
  'excellent', 'very_good', 'good', 'fair', 'poor', 'damaged'
);

-- Add selling-related columns to clothing_items table
ALTER TABLE clothing_items 
ADD COLUMN IF NOT EXISTS original_price decimal(10,2) CHECK (original_price >= 0),
ADD COLUMN IF NOT EXISTS current_value decimal(10,2) CHECK (current_value >= 0),
ADD COLUMN IF NOT EXISTS selling_price decimal(10,2) CHECK (selling_price >= 0),
ADD COLUMN IF NOT EXISTS condition item_condition DEFAULT 'good',
ADD COLUMN IF NOT EXISTS is_for_sale boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sale_listing jsonb DEFAULT '{}'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clothing_items_is_for_sale ON clothing_items(is_for_sale) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clothing_items_condition ON clothing_items(condition) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clothing_items_selling_price ON clothing_items(selling_price) WHERE deleted_at IS NULL AND is_for_sale = true; 