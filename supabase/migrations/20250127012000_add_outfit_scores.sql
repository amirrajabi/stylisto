/*
  # Add outfit score fields to saved_outfits table

  1. Changes
    - Add total_score decimal field for overall outfit score (0.0 to 1.0)
    - Add style_harmony_score decimal field for style harmony calculation
    - Add color_match_score decimal field for color matching score
    - Add season_fit_score decimal field for season appropriateness
    - Add occasion_score decimal field for occasion suitability
    - Add weather_score decimal field for weather appropriateness (optional)
    - Add user_preference_score decimal field for user preference matching
    - Add variety_score decimal field for outfit variety scoring

  2. Data migration
    - Set default scores for existing outfits
    - Extract scores from notes field where possible
*/

-- Add score columns to saved_outfits table
ALTER TABLE saved_outfits 
ADD COLUMN IF NOT EXISTS total_score decimal(3,2) DEFAULT 0.85 CHECK (total_score >= 0.0 AND total_score <= 1.0),
ADD COLUMN IF NOT EXISTS style_harmony_score decimal(3,2) DEFAULT 0.85 CHECK (style_harmony_score >= 0.0 AND style_harmony_score <= 1.0),
ADD COLUMN IF NOT EXISTS color_match_score decimal(3,2) DEFAULT 0.85 CHECK (color_match_score >= 0.0 AND color_match_score <= 1.0),
ADD COLUMN IF NOT EXISTS season_fit_score decimal(3,2) DEFAULT 0.85 CHECK (season_fit_score >= 0.0 AND season_fit_score <= 1.0),
ADD COLUMN IF NOT EXISTS occasion_score decimal(3,2) DEFAULT 0.85 CHECK (occasion_score >= 0.0 AND occasion_score <= 1.0),
ADD COLUMN IF NOT EXISTS weather_score decimal(3,2) DEFAULT NULL CHECK (weather_score IS NULL OR (weather_score >= 0.0 AND weather_score <= 1.0)),
ADD COLUMN IF NOT EXISTS user_preference_score decimal(3,2) DEFAULT 0.80 CHECK (user_preference_score >= 0.0 AND user_preference_score <= 1.0),
ADD COLUMN IF NOT EXISTS variety_score decimal(3,2) DEFAULT 0.75 CHECK (variety_score >= 0.0 AND variety_score <= 1.0);

-- Create function to extract score from notes field
CREATE OR REPLACE FUNCTION extract_score_from_notes(notes_text text)
RETURNS decimal(3,2)
LANGUAGE plpgsql
AS $$
DECLARE
  score_match text;
  extracted_score decimal(3,2);
BEGIN
  -- Try to extract score percentage from notes (e.g., "Score: 85%")
  score_match := substring(notes_text FROM 'Score:\s*(\d+)%');
  
  IF score_match IS NOT NULL THEN
    extracted_score := score_match::decimal / 100.0;
    -- Ensure score is within valid range
    extracted_score := GREATEST(0.60, LEAST(1.0, extracted_score));
    RETURN extracted_score;
  END IF;
  
  -- Default score if no match found
  RETURN 0.85;
END;
$$;

-- Update existing records with extracted scores from notes
UPDATE saved_outfits 
SET total_score = extract_score_from_notes(notes)
WHERE notes IS NOT NULL AND notes LIKE '%Score:%';

-- Create indexes for performance when filtering/sorting by scores
CREATE INDEX IF NOT EXISTS idx_saved_outfits_total_score 
ON saved_outfits(total_score DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_saved_outfits_style_harmony_score 
ON saved_outfits(style_harmony_score DESC) 
WHERE deleted_at IS NULL;

-- Drop the temporary function
DROP FUNCTION IF EXISTS extract_score_from_notes(text); 