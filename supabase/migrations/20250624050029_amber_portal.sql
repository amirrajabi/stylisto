/*
  # Storage Utility Functions

  1. Image Cleanup Functions
    - Function to identify and clean up orphaned images
    - Function to get storage usage statistics

  2. Image Transformation Functions
    - Function to generate thumbnail URLs
    - Function to generate optimized image URLs
*/

-- Function to generate thumbnail URL
CREATE OR REPLACE FUNCTION generate_thumbnail_url(
  image_path text,
  width int DEFAULT 200,
  height int DEFAULT 200,
  format text DEFAULT 'webp'
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_url text;
  bucket_name text := 'wardrobe-images';
  transform_params text;
BEGIN
  -- Get base storage URL from settings
  SELECT value INTO base_url FROM storage.buckets WHERE id = bucket_name;
  
  -- Build transform parameters
  transform_params := format('width=%s&height=%s&resize=cover&format=%s', width, height, format);
  
  -- Return full URL with transform parameters
  RETURN format('%s/storage/v1/object/public/%s/%s?%s', 
                base_url, 
                bucket_name, 
                image_path,
                transform_params);
END;
$$;

-- Function to generate optimized image URL based on usage type
CREATE OR REPLACE FUNCTION get_optimized_image_url(
  image_path text,
  usage_type text DEFAULT 'medium'
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  result text;
BEGIN
  CASE usage_type
    WHEN 'thumbnail' THEN
      SELECT generate_thumbnail_url(image_path, 200, 200, 'webp') INTO result;
    WHEN 'medium' THEN
      SELECT generate_thumbnail_url(image_path, 800, 1000, 'webp') INTO result;
    WHEN 'large' THEN
      SELECT generate_thumbnail_url(image_path, 1200, 1600, 'webp') INTO result;
    ELSE
      -- Original image, no transformations
      SELECT format('%s/storage/v1/object/public/%s/%s', 
                   (SELECT value FROM storage.buckets WHERE id = 'wardrobe-images'),
                   'wardrobe-images',
                   image_path) INTO result;
  END CASE;
  
  RETURN result;
END;
$$;

-- Function to update image references when items are soft deleted
CREATE OR REPLACE FUNCTION update_image_references()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- When an item is soft deleted, we don't delete the image immediately
  -- This allows for recovery and maintains the relationship
  -- Images will be cleaned up by the orphaned file cleanup process if needed
  RETURN NEW;
END;
$$;

-- Create trigger for clothing_items
CREATE TRIGGER update_clothing_item_image_references
BEFORE UPDATE OF deleted_at ON clothing_items
FOR EACH ROW
WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
EXECUTE FUNCTION update_image_references();

-- Create trigger for saved_outfits
CREATE TRIGGER update_outfit_image_references
BEFORE UPDATE OF deleted_at ON saved_outfits
FOR EACH ROW
WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
EXECUTE FUNCTION update_image_references();

-- Function to extract image path from URL
CREATE OR REPLACE FUNCTION extract_storage_path(url text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  path_match text;
BEGIN
  -- Extract path from URL pattern
  SELECT substring(url from '/wardrobe-images/(.+?)(\?|$)') INTO path_match;
  RETURN path_match;
END;
$$;

-- Function to get image metadata
CREATE OR REPLACE FUNCTION get_image_metadata(image_path text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT metadata INTO result
  FROM storage.objects
  WHERE bucket_id = 'wardrobe-images' AND name = image_path;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Function to update image metadata
CREATE OR REPLACE FUNCTION update_image_metadata(
  image_path text,
  metadata_updates jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_metadata jsonb;
  updated_metadata jsonb;
BEGIN
  -- Get current metadata
  SELECT metadata INTO current_metadata
  FROM storage.objects
  WHERE bucket_id = 'wardrobe-images' AND name = image_path;
  
  IF current_metadata IS NULL THEN
    RETURN false;
  END IF;
  
  -- Merge current metadata with updates
  updated_metadata := current_metadata || metadata_updates;
  
  -- Update metadata
  UPDATE storage.objects
  SET metadata = updated_metadata
  WHERE bucket_id = 'wardrobe-images' AND name = image_path;
  
  RETURN FOUND;
END;
$$;