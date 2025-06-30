/*
  # Add SMS Support

  1. New Tables
    - `sms_logs`
      - `id` (uuid, primary key)
      - `phone_number` (text)
      - `message` (text)
      - `complaint_id` (uuid, optional)
      - `user_id` (uuid, optional)
      - `message_id` (text)
      - `status` (text)
      - `sent_at` (timestamptz)
    - `cache`
      - `key` (text, primary key)
      - `data` (jsonb)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for service role access
*/

-- Create SMS logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  message text NOT NULL,
  complaint_id uuid REFERENCES complaints(id) ON DELETE SET NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  message_id text,
  status text,
  sent_at timestamptz DEFAULT now()
);

-- Create cache table
CREATE TABLE IF NOT EXISTS cache (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
    -- Check if policy exists before dropping
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'sms_logs' 
        AND policyname = 'Service role can manage SMS logs'
    ) THEN
        DROP POLICY "Service role can manage SMS logs" ON sms_logs;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'sms_logs' 
        AND policyname = 'Admin can read SMS logs'
    ) THEN
        DROP POLICY "Admin can read SMS logs" ON sms_logs;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'cache' 
        AND policyname = 'Service role can manage cache'
    ) THEN
        DROP POLICY "Service role can manage cache" ON cache;
    END IF;
END
$$;

-- Add RLS policies for SMS logs
CREATE POLICY "Service role can manage SMS logs" 
  ON sms_logs 
  FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Admin can read SMS logs" 
  ON sms_logs 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add RLS policies for cache
CREATE POLICY "Service role can manage cache" 
  ON cache 
  FOR ALL 
  TO service_role 
  USING (true);

-- Add phone_notification_enabled to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_notification_enabled boolean DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_complaint_id ON sms_logs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_cache_created_at ON cache(created_at);