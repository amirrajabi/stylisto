/*
  # Fix RLS Policy for Soft Delete Operations

  1. Issues identified:
    - The existing UPDATE policy has a condition "deleted_at IS NULL" in the USING clause
    - This prevents soft delete operations (setting deleted_at) because the USING clause is checked before the update
    - The previous fix attempt might have conflicting policies

  2. Solution:
    - Remove the "deleted_at IS NULL" condition from the USING clause of the UPDATE policy
    - Keep the condition only in the WITH CHECK clause if needed
    - Ensure we can update items that are not yet deleted to mark them as deleted
*/

-- Drop existing UPDATE policies to avoid conflicts
DROP POLICY IF EXISTS "Users can update own clothing items" ON clothing_items;
DROP POLICY IF EXISTS "Users can soft delete own clothing items" ON clothing_items;

-- Create a single, comprehensive UPDATE policy that allows soft delete
CREATE POLICY "Users can update own clothing items"
  ON clothing_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure we still have a SELECT policy that only shows non-deleted items
DROP POLICY IF EXISTS "Users can read own clothing items" ON clothing_items;

CREATE POLICY "Users can read own clothing items"
  ON clothing_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL); 