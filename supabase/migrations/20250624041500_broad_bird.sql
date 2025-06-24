/*
  # Create AI Feedback Table

  1. New Tables
    - `ai_feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `feedback_type` (text) - Type of AI feedback
      - `context_data` (jsonb) - Context for the feedback
      - `ai_response` (jsonb) - AI generated response
      - `user_rating` (integer) - User rating of feedback (1-5)
      - `user_feedback` (text) - User's textual feedback
      - `is_helpful` (boolean) - Whether user found it helpful
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ai_feedback` table
    - Add policies for users to manage their own feedback
*/

CREATE TYPE feedback_type AS ENUM (
  'outfit_suggestion', 'style_recommendation', 'color_matching', 
  'weather_outfit', 'occasion_outfit', 'item_categorization'
);

CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback_type feedback_type NOT NULL,
  context_data jsonb DEFAULT '{}',
  ai_response jsonb DEFAULT '{}',
  user_rating integer CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback text,
  is_helpful boolean,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own ai feedback"
  ON ai_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai feedback"
  ON ai_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai feedback"
  ON ai_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai feedback"
  ON ai_feedback
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_ai_feedback_updated_at
  BEFORE UPDATE ON ai_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(user_rating);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_helpful ON ai_feedback(is_helpful);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created_at ON ai_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_context ON ai_feedback USING GIN(context_data);