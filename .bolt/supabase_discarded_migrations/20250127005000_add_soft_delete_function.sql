/*
  # Add Soft Delete Function for Clothing Items

  1. Issues identified:
    - RLS policies are preventing soft delete operations
    - Client-side updates are being blocked due to policy conditions

  2. Solution:
    - Create a database function with SECURITY DEFINER to perform soft delete
    - Function will validate ownership before performing the operation
    - This bypasses RLS constraints while maintaining security
*/

-- Create a function to safely soft delete clothing items
CREATE OR REPLACE FUNCTION soft_delete_clothing_item(item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  item_record record;
  result jsonb;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;

  -- Get the item and verify ownership
  SELECT * INTO item_record
  FROM clothing_items
  WHERE id = item_id;

  -- Check if item exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item not found'
    );
  END IF;

  -- Check ownership
  IF item_record.user_id != current_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You do not have permission to delete this item'
    );
  END IF;

  -- Check if already deleted
  IF item_record.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item is already deleted'
    );
  END IF;

  -- Perform the soft delete
  UPDATE clothing_items
  SET 
    deleted_at = now(),
    updated_at = now()
  WHERE id = item_id;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Item successfully deleted'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_clothing_item(uuid) TO authenticated; 