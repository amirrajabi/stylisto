/*
  # Enhance Users Table with Complete Profile Information

  1. Purpose:
    - Add comprehensive user profile fields
    - Support for personal information, preferences, and settings
    - Maintain backward compatibility

  2. New Fields:
    - Personal Information: first_name, last_name, username, date_of_birth, gender, phone, avatar_url
    - Location: country, city, timezone
    - Preferences: preferred_language, preferred_currency
    - Body measurements for clothing recommendations
    - Style preferences and settings
    - Privacy and notification settings
    - Account metadata
*/

-- Add personal information fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say')),
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add location and timezone information
ALTER TABLE users
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Australia/Sydney';

-- Add language and currency preferences
ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'AUD';

-- Add body measurements for clothing recommendations
ALTER TABLE users
ADD COLUMN IF NOT EXISTS height_cm integer,
ADD COLUMN IF NOT EXISTS weight_kg numeric(5,2),
ADD COLUMN IF NOT EXISTS clothing_size_top text,
ADD COLUMN IF NOT EXISTS clothing_size_bottom text,
ADD COLUMN IF NOT EXISTS clothing_size_shoes text,
ADD COLUMN IF NOT EXISTS body_type text CHECK (body_type IN ('pear', 'apple', 'hourglass', 'rectangle', 'inverted-triangle'));

-- Add style preferences
ALTER TABLE users
ADD COLUMN IF NOT EXISTS style_preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS color_preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS brand_preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS budget_range jsonb DEFAULT '{"min": 0, "max": 1000, "currency": "AUD"}';

-- Add privacy and notification settings
ALTER TABLE users
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"profile_visibility": "private", "data_sharing": false}',
ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"push_notifications": true, "email_notifications": true, "outfit_recommendations": true, "weather_alerts": true}';

-- Add account metadata
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro'));

-- Add bio and social links for enhanced profile
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Add constraint for unique username (case insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique 
  ON users(LOWER(username)) 
  WHERE username IS NOT NULL;

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Function to check profile completion
CREATE OR REPLACE FUNCTION check_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile_completed based on essential fields
  NEW.profile_completed = (
    NEW.first_name IS NOT NULL AND NEW.first_name != '' AND
    NEW.last_name IS NOT NULL AND NEW.last_name != '' AND
    NEW.gender IS NOT NULL AND
    NEW.date_of_birth IS NOT NULL AND
    NEW.country IS NOT NULL AND NEW.country != ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically check profile completion
DROP TRIGGER IF EXISTS check_profile_completion ON users;
CREATE TRIGGER check_profile_completion
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_profile_completion(); 