/*
  # Fix RLS Policies for Soft Delete Operations

  1. Changes
    - Update RLS policies to allow soft delete operations
    - Allow users to update their own saved_outfits even when setting deleted_at
    
  2. Security
    - Users can only update their own outfits
    - Users can only soft delete their own outfits
*/

-- Drop and recreate the update policy for saved_outfits to allow soft delete
DROP POLICY IF EXISTS "Users can update own saved outfits" ON saved_outfits;

CREATE POLICY "Users can update own saved outfits"
  ON saved_outfits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also ensure the select policy includes deleted items for the user to manage them
DROP POLICY IF EXISTS "Users can read own saved outfits" ON saved_outfits;

CREATE POLICY "Users can read own saved outfits"
  ON saved_outfits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Update outfit_items policy to work with soft deleted outfits
DROP POLICY IF EXISTS "Users can read own outfit items" ON outfit_items;

CREATE POLICY "Users can read own outfit items"
  ON outfit_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saved_outfits so 
      WHERE so.id = outfit_items.outfit_id 
      AND so.user_id = auth.uid()
    )
  ); 