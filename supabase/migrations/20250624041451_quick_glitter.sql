/*
  # Create User Preferences Table

  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users, unique)
      - `style_preferences` (jsonb) - Stores style preferences
      - `size_preferences` (jsonb) - Stores size information
      - `color_preferences` (text array) - Preferred colors
      - `brand_preferences` (text array) - Preferred brands
      - `weather_location` (text) - Location for weather integration
      - `notification_settings` (jsonb) - Notification preferences
      - `privacy_settings` (jsonb) - Privacy settings
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_preferences` table
    - Add policies for users to manage their own preferences
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  style_preferences jsonb DEFAULT '{}',
  size_preferences jsonb DEFAULT '{}',
  color_preferences text[] DEFAULT '{}',
  brand_preferences text[] DEFAULT '{}',
  weather_location text,
  notification_settings jsonb DEFAULT '{
    "outfit_reminders": true,
    "weather_alerts": true,
    "style_tips": true,
    "new_features": true
  }',
  privacy_settings jsonb DEFAULT '{
    "profile_visibility": "private",
    "share_outfits": false,
    "analytics_tracking": true
  }',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_style ON user_preferences USING GIN(style_preferences);
CREATE INDEX IF NOT EXISTS idx_user_preferences_color_prefs ON user_preferences USING GIN(color_preferences);
CREATE INDEX IF NOT EXISTS idx_user_preferences_brand_prefs ON user_preferences USING GIN(brand_preferences);