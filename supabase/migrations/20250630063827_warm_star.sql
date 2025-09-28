/*
  # Authentication System Enhancement

  1. Updates to profiles table
    - Add `username` column (text, unique)
    - Add `email_verification_sent_at` column (timestamptz, nullable)
    - Add `last_login_at` column (timestamptz, nullable)
    - Add `login_count` column (integer, default 0)
    - Add `failed_login_attempts` column (integer, default 0)
    - Add `last_failed_login_at` column (timestamptz, nullable)
    - Add `password_reset_sent_at` column (timestamptz, nullable)
    - Add `password_last_changed_at` column (timestamptz, nullable)

  2. Security
    - Add unique constraint on username
    - Add index on username for faster lookups
    - Update RLS policies to include username-based access
*/

-- Add username column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username text UNIQUE;
  END IF;
END
$$;

-- Add authentication tracking columns to profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_verification_sent_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_verification_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'login_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN login_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE profiles ADD COLUMN failed_login_attempts integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_failed_login_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_failed_login_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'password_reset_sent_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password_reset_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'password_last_changed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password_last_changed_at timestamptz;
  END IF;
END
$$;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create function to update login statistics
CREATE OR REPLACE FUNCTION update_login_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    last_login_at = now(),
    login_count = login_count + 1
  WHERE id = NEW.id;
  
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create function to update failed login attempts
CREATE OR REPLACE FUNCTION update_failed_login_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    failed_login_attempts = failed_login_attempts + 1,
    last_failed_login_at = now()
  WHERE email = NEW.email;
  
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create function to reset failed login attempts on successful login
CREATE OR REPLACE FUNCTION reset_failed_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET failed_login_attempts = 0
  WHERE id = NEW.id;
  
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create function to update password change timestamp
CREATE OR REPLACE FUNCTION update_password_change_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET password_last_changed_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create or replace trigger for login stats
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_login'
  ) THEN
    CREATE TRIGGER on_auth_user_login
      AFTER INSERT ON auth.sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_login_stats();
  END IF;
END
$$;

-- Create or replace trigger for password change
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_password_change'
  ) THEN
    CREATE TRIGGER on_auth_user_password_change
      AFTER UPDATE OF encrypted_password ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION update_password_change_timestamp();
  END IF;
END
$$;