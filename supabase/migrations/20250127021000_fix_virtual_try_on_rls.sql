/*
  # Fix Virtual Try-On Results RLS Policies

  The issue is with the INSERT policy which uses USING instead of WITH CHECK.
  For INSERT operations, we need WITH CHECK to validate the new row.
*/

-- Drop the incorrect INSERT policy
DROP POLICY IF EXISTS "Users can insert own virtual try-on results" ON virtual_try_on_results;

-- Create the correct INSERT policy with WITH CHECK
CREATE POLICY "Users can insert own virtual try-on results"
  ON virtual_try_on_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also ensure we have proper UPDATE policy
DROP POLICY IF EXISTS "Users can update own virtual try-on results" ON virtual_try_on_results;

CREATE POLICY "Users can update own virtual try-on results"
  ON virtual_try_on_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Debug: Create a test function to check auth context
CREATE OR REPLACE FUNCTION debug_auth_context()
RETURNS TABLE(user_id UUID, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    auth.role() as role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 