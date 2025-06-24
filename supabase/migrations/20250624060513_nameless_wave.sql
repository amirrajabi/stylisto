/*
  # AI Feedback Table

  1. New Tables
    - `ai_feedback` - Stores user feedback on AI recommendations
  
  2. Changes
    - Create feedback_type enum
    - Create ai_feedback table with proper indexes
    - Add RLS policies
  
  3. Security
    - Enable RLS on ai_feedback table
    - Add policies for user data isolation
*/

-- Create feedback_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_type') THEN
    CREATE TYPE feedback_type AS ENUM (
      'outfit_suggestion', 
      'style_recommendation', 
      'color_matching', 
      'weather_outfit', 
      'occasion_outfit', 
      'item_categorization'
    );
  END IF;
END $$;

-- Create AI feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback_type feedback_type NOT NULL,
  context_data jsonb DEFAULT '{}'::jsonb,
  ai_response jsonb DEFAULT '{}'::jsonb,
  user_rating integer CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback text,
  is_helpful boolean,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created_at ON ai_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_helpful ON ai_feedback(is_helpful);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(user_rating);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_context ON ai_feedback USING gin (context_data);

-- Add updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_ai_feedback_updated_at'
  ) THEN
    CREATE TRIGGER update_ai_feedback_updated_at
    BEFORE UPDATE ON ai_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_feedback' AND policyname = 'Users can insert own ai feedback'
  ) THEN
    CREATE POLICY "Users can insert own ai feedback"
      ON ai_feedback
      FOR INSERT
      TO authenticated
      WITH CHECK (uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_feedback' AND policyname = 'Users can select own ai feedback'
  ) THEN
    CREATE POLICY "Users can select own ai feedback"
      ON ai_feedback
      FOR SELECT
      TO authenticated
      USING (uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_feedback' AND policyname = 'Users can update own ai feedback'
  ) THEN
    CREATE POLICY "Users can update own ai feedback"
      ON ai_feedback
      FOR UPDATE
      TO authenticated
      USING (uid() = user_id)
      WITH CHECK (uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_feedback' AND policyname = 'Users can delete own ai feedback'
  ) THEN
    CREATE POLICY "Users can delete own ai feedback"
      ON ai_feedback
      FOR DELETE
      TO authenticated
      USING (uid() = user_id);
  END IF;
END $$;