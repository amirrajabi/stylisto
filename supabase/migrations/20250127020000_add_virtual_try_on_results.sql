/*
  # Virtual Try-On Results Storage

  1. Table Structure
    - Creates a table to store virtual try-on results metadata
    - Links to user, outfit, and storage path
    - Tracks processing details and confidence scores

  2. Security
    - Enable RLS
    - Users can only access their own results
    - Proper indexes for performance
*/

-- Create virtual_try_on_results table
CREATE TABLE IF NOT EXISTS virtual_try_on_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id TEXT NOT NULL,
  outfit_name TEXT NOT NULL,
  
  -- Image URLs
  user_image_url TEXT NOT NULL,
  generated_image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  
  -- Processing metadata
  processing_time_ms INTEGER NOT NULL DEFAULT 0,
  confidence_score NUMERIC(3,2) DEFAULT 0.85 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- AI Generation details
  prompt_used TEXT,
  style_instructions TEXT,
  items_used JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE virtual_try_on_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own virtual try-on results"
  ON virtual_try_on_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own virtual try-on results"
  ON virtual_try_on_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own virtual try-on results"
  ON virtual_try_on_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own virtual try-on results"
  ON virtual_try_on_results
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_virtual_try_on_results_user_id 
  ON virtual_try_on_results(user_id);

CREATE INDEX IF NOT EXISTS idx_virtual_try_on_results_outfit_id 
  ON virtual_try_on_results(outfit_id);

CREATE INDEX IF NOT EXISTS idx_virtual_try_on_results_created_at 
  ON virtual_try_on_results(created_at DESC);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_virtual_try_on_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_virtual_try_on_results_updated_at
  BEFORE UPDATE ON virtual_try_on_results
  FOR EACH ROW
  EXECUTE FUNCTION update_virtual_try_on_results_updated_at(); 