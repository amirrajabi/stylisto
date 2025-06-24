/*
  # User Account Deletion Function

  This migration creates a function to handle user account deletion,
  ensuring all user data is properly removed while maintaining referential integrity.
*/

-- Create function to delete user account and all associated data
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Validate user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Soft delete user data with timestamps
  -- This approach maintains referential integrity while marking data as deleted
  
  -- Update user record
  UPDATE users
  SET 
    deleted_at = now(),
    updated_at = now(),
    email = 'deleted_' || current_user_id || '@deleted.com',
    full_name = 'Deleted User'
  WHERE id = current_user_id;
  
  -- Soft delete clothing items
  UPDATE clothing_items
  SET 
    deleted_at = now(),
    updated_at = now()
  WHERE user_id = current_user_id AND deleted_at IS NULL;
  
  -- Soft delete saved outfits
  UPDATE saved_outfits
  SET 
    deleted_at = now(),
    updated_at = now()
  WHERE user_id = current_user_id AND deleted_at IS NULL;
  
  -- Delete user preferences
  DELETE FROM user_preferences
  WHERE user_id = current_user_id;
  
  -- Delete AI feedback
  DELETE FROM ai_feedback
  WHERE user_id = current_user_id;
  
  -- Delete user sessions
  DELETE FROM user_sessions
  WHERE user_id = current_user_id;
  
  -- Delete item interactions
  DELETE FROM item_interactions
  WHERE user_id = current_user_id;
  
  -- Delete outfit analytics
  DELETE FROM outfit_analytics
  WHERE user_id = current_user_id;
  
  -- Note: In a production environment, you might want to:
  -- 1. Schedule actual data deletion after a retention period
  -- 2. Implement a way to recover accounts during a grace period
  -- 3. Add audit logging for compliance purposes
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- Create a trigger to clean up storage when a user is deleted
CREATE OR REPLACE FUNCTION cleanup_user_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- This would delete all files in the user's storage folder
  -- In a real implementation, you would use a more robust approach
  -- such as a background job to handle large amounts of files
  DELETE FROM storage.objects
  WHERE bucket_id = 'wardrobe-images'
    AND (storage.foldername(name))[1] = OLD.id::text;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_cleanup_user_storage'
  ) THEN
    CREATE TRIGGER trigger_cleanup_user_storage
    AFTER UPDATE OF deleted_at ON users
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION cleanup_user_storage();
  END IF;
END $$;