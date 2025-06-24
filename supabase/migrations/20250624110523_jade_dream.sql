/*
  # Add performance metrics table

  1. New Tables
    - `performance_metrics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `component` (text)
      - `metrics` (jsonb)
      - `device_info` (jsonb)
      - `timestamp` (timestamptz)
  2. Security
    - Enable RLS on `performance_metrics` table
    - Add policy for authenticated users to insert their own metrics
    - Add policy for authenticated users to read their own metrics
*/

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  component text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  device_info jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_component ON performance_metrics(component);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);

-- Enable RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own performance metrics"
  ON performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own performance metrics"
  ON performance_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);