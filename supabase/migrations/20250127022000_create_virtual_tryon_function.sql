/*
  # Create function to insert virtual try-on results
  
  This function bypasses RLS and allows authenticated users to insert their own records
*/

CREATE OR REPLACE FUNCTION insert_virtual_try_on_result(
  p_user_id UUID,
  p_outfit_id TEXT,
  p_outfit_name TEXT,
  p_user_image_url TEXT,
  p_generated_image_url TEXT,
  p_storage_path TEXT,
  p_processing_time_ms INTEGER DEFAULT 30000,
  p_confidence_score NUMERIC(3,2) DEFAULT 0.85,
  p_prompt_used TEXT DEFAULT NULL,
  p_style_instructions TEXT DEFAULT 'natural fit, professional photography',
  p_items_used JSONB DEFAULT '[]'::jsonb
) RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  result_id UUID;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if the provided user_id matches the authenticated user
  IF current_user_id != p_user_id THEN
    RAISE EXCEPTION 'User ID mismatch: cannot insert data for another user';
  END IF;
  
  -- Insert the record (this bypasses RLS due to SECURITY DEFINER)
  INSERT INTO virtual_try_on_results (
    user_id,
    outfit_id,
    outfit_name,
    user_image_url,
    generated_image_url,
    storage_path,
    processing_time_ms,
    confidence_score,
    prompt_used,
    style_instructions,
    items_used
  ) VALUES (
    p_user_id,
    p_outfit_id,
    p_outfit_name,
    p_user_image_url,
    p_generated_image_url,
    p_storage_path,
    p_processing_time_ms,
    p_confidence_score,
    p_prompt_used,
    p_style_instructions,
    p_items_used
  ) RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_virtual_try_on_result(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, NUMERIC(3,2), TEXT, TEXT, JSONB) TO authenticated; 