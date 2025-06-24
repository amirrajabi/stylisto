/*
  # Analytics Tables

  1. New Tables
    - `analytics_events` - Stores all analytics events
    - `analytics_funnels` - Stores conversion funnel definitions
    - `analytics_funnel_steps` - Stores steps for each funnel
    - `analytics_user_properties` - Stores user properties for analytics
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for admin users
*/

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  event_category text,
  event_properties jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now(),
  platform text,
  app_version text,
  session_id text
);

-- Create analytics_funnels table
CREATE TABLE IF NOT EXISTS analytics_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create analytics_funnel_steps table
CREATE TABLE IF NOT EXISTS analytics_funnel_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid REFERENCES analytics_funnels(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  event_name text NOT NULL,
  step_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create analytics_user_properties table
CREATE TABLE IF NOT EXISTS analytics_user_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_name text NOT NULL,
  property_value jsonb NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_user_properties_user_id ON analytics_user_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_properties_name ON analytics_user_properties(property_name);
CREATE INDEX IF NOT EXISTS idx_analytics_funnel_steps_funnel_id ON analytics_funnel_steps(funnel_id);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_user_properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analytics_events
CREATE POLICY "Users can insert their own analytics events"
  ON analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own analytics events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for analytics_user_properties
CREATE POLICY "Users can insert their own analytics properties"
  ON analytics_user_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own analytics properties"
  ON analytics_user_properties
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for analytics_funnels (admin only)
CREATE POLICY "Admins can manage funnels"
  ON analytics_funnels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Create RLS policies for analytics_funnel_steps (admin only)
CREATE POLICY "Admins can manage funnel steps"
  ON analytics_funnel_steps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Create analytics_events_cleanup function to automatically delete old events
CREATE OR REPLACE FUNCTION analytics_events_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete events older than 2 years (GDPR compliance)
  DELETE FROM analytics_events
  WHERE timestamp < NOW() - INTERVAL '2 years';
  
  -- Delete user properties older than 2 years
  DELETE FROM analytics_user_properties
  WHERE timestamp < NOW() - INTERVAL '2 years';
END;
$$;

-- Create a scheduled job to run the cleanup function monthly
-- Note: This requires pg_cron extension to be enabled
-- In a real environment, you would set this up with a cron job or similar
COMMENT ON FUNCTION analytics_events_cleanup() IS 'Cleans up old analytics data for GDPR compliance';