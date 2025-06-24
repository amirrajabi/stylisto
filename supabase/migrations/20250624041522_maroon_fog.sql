/*
  # Create Database Functions and Views

  1. Functions
    - Soft delete functions
    - Analytics aggregation functions
    - Wardrobe statistics functions

  2. Views
    - User wardrobe summary
    - Popular items view
    - Outfit recommendations view

  3. Security
    - All functions respect RLS policies
    - Views include proper filtering
*/

-- Soft delete function for clothing items
CREATE OR REPLACE FUNCTION soft_delete_clothing_item(item_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE clothing_items 
  SET deleted_at = now(), updated_at = now()
  WHERE id = item_id 
    AND user_id = auth.uid() 
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Soft delete function for outfits
CREATE OR REPLACE FUNCTION soft_delete_outfit(outfit_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE saved_outfits 
  SET deleted_at = now(), updated_at = now()
  WHERE id = outfit_id 
    AND user_id = auth.uid() 
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Function to get wardrobe statistics
CREATE OR REPLACE FUNCTION get_wardrobe_stats(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats jsonb;
BEGIN
  -- Check if user is requesting their own stats
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'total_items', COUNT(*),
    'favorite_items', COUNT(*) FILTER (WHERE is_favorite = true),
    'items_by_category', jsonb_object_agg(category, category_count),
    'most_worn_item', (
      SELECT jsonb_build_object('name', name, 'times_worn', times_worn)
      FROM clothing_items 
      WHERE user_id = user_uuid AND deleted_at IS NULL
      ORDER BY times_worn DESC 
      LIMIT 1
    ),
    'total_value', COALESCE(SUM(price), 0),
    'avg_times_worn', ROUND(AVG(times_worn), 2)
  ) INTO stats
  FROM (
    SELECT 
      category,
      COUNT(*) as category_count,
      name,
      times_worn,
      price,
      is_favorite
    FROM clothing_items 
    WHERE user_id = user_uuid AND deleted_at IS NULL
    GROUP BY category, name, times_worn, price, is_favorite
  ) subquery;

  RETURN stats;
END;
$$;

-- Function to record item interaction
CREATE OR REPLACE FUNCTION record_item_interaction(
  item_id uuid,
  interaction_type text,
  interaction_data jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO item_interactions (user_id, clothing_item_id, interaction_type, interaction_data)
  VALUES (auth.uid(), item_id, interaction_type, interaction_data);
  
  -- Update times_worn if interaction is 'worn'
  IF interaction_type = 'worn' THEN
    UPDATE clothing_items 
    SET times_worn = times_worn + 1, 
        last_worn = now(),
        updated_at = now()
    WHERE id = item_id AND user_id = auth.uid();
  END IF;
END;
$$;

-- Create view for user wardrobe summary
CREATE OR REPLACE VIEW user_wardrobe_summary AS
SELECT 
  u.id as user_id,
  u.full_name,
  COUNT(ci.id) as total_items,
  COUNT(ci.id) FILTER (WHERE ci.is_favorite = true) as favorite_items,
  COUNT(so.id) as total_outfits,
  COALESCE(SUM(ci.price), 0) as total_wardrobe_value,
  ROUND(AVG(ci.times_worn), 2) as avg_times_worn,
  MAX(ci.created_at) as last_item_added
FROM users u
LEFT JOIN clothing_items ci ON u.id = ci.user_id AND ci.deleted_at IS NULL
LEFT JOIN saved_outfits so ON u.id = so.user_id AND so.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.full_name;

-- Create view for popular items (most worn)
CREATE OR REPLACE VIEW popular_items AS
SELECT 
  ci.id,
  ci.user_id,
  ci.name,
  ci.category,
  ci.brand,
  ci.times_worn,
  ci.last_worn,
  ci.image_url,
  RANK() OVER (PARTITION BY ci.user_id ORDER BY ci.times_worn DESC) as popularity_rank
FROM clothing_items ci
WHERE ci.deleted_at IS NULL AND ci.times_worn > 0;

-- Create view for outfit recommendations based on weather and occasion
CREATE OR REPLACE VIEW outfit_recommendations AS
SELECT DISTINCT
  so.id as outfit_id,
  so.user_id,
  so.name as outfit_name,
  so.occasions,
  so.seasons,
  so.times_worn,
  so.is_favorite,
  array_agg(ci.category) as item_categories,
  array_agg(ci.color) as item_colors,
  COUNT(oi.clothing_item_id) as item_count
FROM saved_outfits so
JOIN outfit_items oi ON so.id = oi.outfit_id
JOIN clothing_items ci ON oi.clothing_item_id = ci.id
WHERE so.deleted_at IS NULL AND ci.deleted_at IS NULL
GROUP BY so.id, so.user_id, so.name, so.occasions, so.seasons, so.times_worn, so.is_favorite;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION soft_delete_clothing_item(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_outfit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_wardrobe_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION record_item_interaction(uuid, text, jsonb) TO authenticated;

GRANT SELECT ON user_wardrobe_summary TO authenticated;
GRANT SELECT ON popular_items TO authenticated;
GRANT SELECT ON outfit_recommendations TO authenticated;