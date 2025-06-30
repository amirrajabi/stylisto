/*
  # Fix RLS Policies for Clothing Items Delete Operation

  1. Issue
    - The existing UPDATE policy may be too restrictive for soft delete operations
    - The DELETE policy is for hard deletes but we're using soft deletes (setting deleted_at)

  2. Solution
    - Add a specific policy for soft delete operations
    - Ensure UPDATE policy allows setting deleted_at field
*/

-- Drop and recreate the UPDATE policy to ensure it allows soft delete
DROP POLICY IF EXISTS "Users can update own clothing items" ON clothing_items;

CREATE POLICY "Users can update own clothing items"
  ON clothing_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add specific policy for soft delete (setting deleted_at) if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can soft delete own clothing items' 
    AND tablename = 'clothing_items'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can soft delete own clothing items"
      ON clothing_items
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id AND deleted_at IS NULL)
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$; 