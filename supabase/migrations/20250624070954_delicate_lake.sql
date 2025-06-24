/*
  # Error Logging Schema

  1. New Tables
    - `error_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `error_message` (text)
      - `error_stack` (text)
      - `error_name` (text)
      - `context` (jsonb)
      - `feedback` (text)
      - `platform` (text)
      - `app_version` (text)
      - `created_at` (timestamptz)
    - `health_checks`
      - `id` (uuid, primary key)
      - `status` (text)
      - `message` (text)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `error_logs` table
    - Add policy for authenticated users to insert their own error logs
    - Add policy for authenticated users to read their own error logs
*/

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  error_message text NOT NULL,
  error_stack text,
  error_name text,
  context jsonb DEFAULT '{}'::jsonb,
  feedback text,
  platform text NOT NULL,
  app_version text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create health_checks table
CREATE TABLE IF NOT EXISTS health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_platform ON error_logs(platform);
CREATE INDEX IF NOT EXISTS idx_error_logs_app_version ON error_logs(app_version);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_name ON error_logs(error_name);
CREATE INDEX IF NOT EXISTS idx_health_checks_created_at ON health_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status);

-- Enable RLS on error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for error_logs
CREATE POLICY "Users can insert own error logs"
  ON error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to clean up old error logs
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete error logs older than 30 days
  DELETE FROM error_logs
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Create function to insert health check
CREATE OR REPLACE FUNCTION insert_health_check(check_status text, check_message text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO health_checks (status, message)
  VALUES (check_status, check_message)
  RETURNING id INTO new_id;
  
  -- Clean up old health checks
  DELETE FROM health_checks
  WHERE created_at < now() - interval '7 days';
  
  RETURN new_id;
END;
$$;

-- Insert initial health check
SELECT insert_health_check('ok', 'Initial health check');