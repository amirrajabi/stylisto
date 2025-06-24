/*
  # Create Analytics and Usage Tables

  1. New Tables
    - `user_sessions`
      - Track user app usage sessions
    - `item_interactions`
      - Track interactions with clothing items
    - `outfit_analytics`
      - Track outfit usage and performance

  2. Security
    - Enable RLS on all analytics tables
    - Add policies for users to access their own data
*/

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_start timestamptz DEFAULT now() NOT NULL,
  session_end timestamptz,
  duration_minutes integer,
  platform text NOT NULL, -- 'web', 'ios', 'android'
  app_version text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS item_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clothing_item_id uuid NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
  interaction_type text NOT NULL, -- 'view', 'favorite', 'worn', 'edit', 'delete'
  interaction_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS outfit_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outfit_id uuid NOT NULL REFERENCES saved_outfits(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'created', 'worn', 'shared', 'favorited'
  event_data jsonb DEFAULT '{}',
  weather_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for user_sessions
CREATE POLICY "Users can read own sessions"
  ON user_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON user_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for item_interactions
CREATE POLICY "Users can read own item interactions"
  ON item_interactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own item interactions"
  ON item_interactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for outfit_analytics
CREATE POLICY "Users can read own outfit analytics"
  ON outfit_analytics FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfit analytics"
  ON outfit_analytics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start ON user_sessions(session_start DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_platform ON user_sessions(platform);

CREATE INDEX IF NOT EXISTS idx_item_interactions_user_id ON item_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_item_interactions_item_id ON item_interactions(clothing_item_id);
CREATE INDEX IF NOT EXISTS idx_item_interactions_type ON item_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_item_interactions_created_at ON item_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_outfit_analytics_user_id ON outfit_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_analytics_outfit_id ON outfit_analytics(outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_analytics_event_type ON outfit_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_outfit_analytics_created_at ON outfit_analytics(created_at DESC);