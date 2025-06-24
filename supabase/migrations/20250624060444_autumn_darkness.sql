/*
  # Saved Outfits Functionality

  1. New Tables
    - No new tables needed, using existing `saved_outfits` and `outfit_items` tables
  
  2. Changes
    - Add trigger for updating updated_at timestamp on saved_outfits
    - Add function for outfit management
    - Add function for outfit synchronization
  
  3. Security
    - Ensure RLS policies are properly set up
*/

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to get outfit details with items
CREATE OR REPLACE FUNCTION get_outfit_with_items(outfit_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  outfit_data jsonb;
  items_data jsonb;
BEGIN
  -- Get outfit details
  SELECT json_build_object(
    'id', so.id,
    'name', so.name,
    'occasions', so.occasions,
    'seasons', so.seasons,
    'tags', so.tags,
    'is_favorite', so.is_favorite,
    'times_worn', so.times_worn,
    'last_worn', so.last_worn,
    'notes', so.notes,
    'created_at', so.created_at,
    'updated_at', so.updated_at
  )::jsonb INTO outfit_data
  FROM saved_outfits so
  WHERE so.id = outfit_uuid AND so.deleted_at IS NULL;
  
  -- Get outfit items
  SELECT json_agg(
    json_build_object(
      'id', ci.id,
      'name', ci.name,
      'category', ci.category,
      'color', ci.color,
      'brand', ci.brand,
      'image_url', ci.image_url,
      'seasons', ci.seasons,
      'occasions', ci.occasions
    )
  )::jsonb INTO items_data
  FROM outfit_items oi
  JOIN clothing_items ci ON oi.clothing_item_id = ci.id
  WHERE oi.outfit_id = outfit_uuid AND ci.deleted_at IS NULL;
  
  -- Combine outfit and items
  outfit_data := outfit_data || jsonb_build_object('items', COALESCE(items_data, '[]'::jsonb));
  
  RETURN outfit_data;
END;
$$;

-- Create function to sync outfits across devices
CREATE OR REPLACE FUNCTION sync_outfits(user_uuid uuid, last_sync_time timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_outfits jsonb;
  deleted_outfits jsonb;
BEGIN
  -- Get updated outfits since last sync
  SELECT json_agg(
    get_outfit_with_items(so.id)
  )::jsonb INTO updated_outfits
  FROM saved_outfits so
  WHERE so.user_id = user_uuid 
    AND so.deleted_at IS NULL
    AND so.updated_at > last_sync_time;
  
  -- Get deleted outfits since last sync
  SELECT json_agg(
    json_build_object(
      'id', so.id,
      'deleted_at', so.deleted_at
    )
  )::jsonb INTO deleted_outfits
  FROM saved_outfits so
  WHERE so.user_id = user_uuid 
    AND so.deleted_at IS NOT NULL
    AND so.updated_at > last_sync_time;
  
  RETURN jsonb_build_object(
    'updated', COALESCE(updated_outfits, '[]'::jsonb),
    'deleted', COALESCE(deleted_outfits, '[]'::jsonb),
    'sync_time', now()
  );
END;
$$;

-- Create function to record outfit wear
CREATE OR REPLACE FUNCTION record_outfit_worn(outfit_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update outfit wear count and last worn date
  UPDATE saved_outfits
  SET times_worn = times_worn + 1,
      last_worn = now(),
      updated_at = now()
  WHERE id = outfit_uuid AND deleted_at IS NULL;
  
  -- Also update the wear count for all items in the outfit
  UPDATE clothing_items ci
  SET times_worn = times_worn + 1,
      last_worn = now(),
      updated_at = now()
  FROM outfit_items oi
  WHERE oi.outfit_id = outfit_uuid
    AND oi.clothing_item_id = ci.id
    AND ci.deleted_at IS NULL;
END;
$$;

-- Create outfit recommendations view
CREATE OR REPLACE VIEW outfit_recommendations AS
SELECT 
  so.id as outfit_id,
  so.user_id,
  so.name as outfit_name,
  so.occasions,
  so.seasons,
  so.times_worn,
  so.is_favorite,
  array_agg(DISTINCT ci.category) as item_categories,
  array_agg(DISTINCT ci.color) as item_colors,
  count(ci.id) as item_count
FROM saved_outfits so
JOIN outfit_items oi ON so.id = oi.outfit_id
JOIN clothing_items ci ON oi.clothing_item_id = ci.id
WHERE so.deleted_at IS NULL AND ci.deleted_at IS NULL
GROUP BY so.id, so.user_id, so.name, so.occasions, so.seasons, so.times_worn, so.is_favorite;

-- Ensure RLS policies exist for saved_outfits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_outfits' AND policyname = 'Users can read own saved outfits'
  ) THEN
    CREATE POLICY "Users can read own saved outfits"
      ON saved_outfits
      FOR SELECT
      TO authenticated
      USING ((uid() = user_id) AND (deleted_at IS NULL));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_outfits' AND policyname = 'Users can insert own saved outfits'
  ) THEN
    CREATE POLICY "Users can insert own saved outfits"
      ON saved_outfits
      FOR INSERT
      TO authenticated
      WITH CHECK (uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_outfits' AND policyname = 'Users can update own saved outfits'
  ) THEN
    CREATE POLICY "Users can update own saved outfits"
      ON saved_outfits
      FOR UPDATE
      TO authenticated
      USING ((uid() = user_id) AND (deleted_at IS NULL))
      WITH CHECK (uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_outfits' AND policyname = 'Users can delete own saved outfits'
  ) THEN
    CREATE POLICY "Users can delete own saved outfits"
      ON saved_outfits
      FOR DELETE
      TO authenticated
      USING (uid() = user_id);
  END IF;
END $$;

-- Ensure RLS policies exist for outfit_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'outfit_items' AND policyname = 'Users can read own outfit items'
  ) THEN
    CREATE POLICY "Users can read own outfit items"
      ON outfit_items
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1
        FROM saved_outfits so
        WHERE so.id = outfit_items.outfit_id
          AND so.user_id = uid()
          AND so.deleted_at IS NULL
      ));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'outfit_items' AND policyname = 'Users can insert own outfit items'
  ) THEN
    CREATE POLICY "Users can insert own outfit items"
      ON outfit_items
      FOR INSERT
      TO authenticated
      WITH CHECK ((
        EXISTS (
          SELECT 1
          FROM saved_outfits so
          WHERE so.id = outfit_items.outfit_id
            AND so.user_id = uid()
        )
      ) AND (
        EXISTS (
          SELECT 1
          FROM clothing_items ci
          WHERE ci.id = outfit_items.clothing_item_id
            AND ci.user_id = uid()
            AND ci.deleted_at IS NULL
        )
      ));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'outfit_items' AND policyname = 'Users can delete own outfit items'
  ) THEN
    CREATE POLICY "Users can delete own outfit items"
      ON outfit_items
      FOR DELETE
      TO authenticated
      USING (EXISTS (
        SELECT 1
        FROM saved_outfits so
        WHERE so.id = outfit_items.outfit_id
          AND so.user_id = uid()
      ));
  END IF;
END $$;

-- Create trigger for updating updated_at on saved_outfits if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_saved_outfits_updated_at'
  ) THEN
    CREATE TRIGGER update_saved_outfits_updated_at
    BEFORE UPDATE ON saved_outfits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;