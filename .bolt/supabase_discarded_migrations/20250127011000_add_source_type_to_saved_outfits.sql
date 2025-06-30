/*
  # Add source_type to saved_outfits table

  1. Changes
    - Add source_type enum type for distinguishing manual vs AI-generated outfits
    - Add source_type column to saved_outfits table with default 'ai_generated'
    - Update existing records to have 'ai_generated' as source_type
*/

-- Create source_type enum (with proper error handling)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outfit_source_type') THEN
        CREATE TYPE outfit_source_type AS ENUM ('manual', 'ai_generated');
    END IF;
END $$;

-- Add source_type column to saved_outfits table
ALTER TABLE saved_outfits 
ADD COLUMN IF NOT EXISTS source_type outfit_source_type DEFAULT 'ai_generated';

-- Update any existing records to have ai_generated as source_type
UPDATE saved_outfits 
SET source_type = 'ai_generated' 
WHERE source_type IS NULL;

-- Make source_type NOT NULL after setting defaults
ALTER TABLE saved_outfits 
ALTER COLUMN source_type SET NOT NULL;

-- Create index for performance when filtering by source_type
CREATE INDEX IF NOT EXISTS idx_saved_outfits_source_type 
ON saved_outfits(source_type) 
WHERE deleted_at IS NULL; 