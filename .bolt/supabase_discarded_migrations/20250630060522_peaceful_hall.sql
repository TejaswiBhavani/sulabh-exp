/*
  # Authentication and User Profile Tables

  1. New Tables
    - `profiles` table to store user profile information
      - `id` (uuid, primary key) - references auth.users
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `phone` (text, nullable)
      - `role` (user_role enum, default 'citizen')
      - `department` (text, nullable)
      - `is_verified` (boolean, default false)
      - `phone_notification_enabled` (boolean, default false)
      - `email_notification_enabled` (boolean, default true)
      - `is_phone_verified` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Create trigger to update updated_at column
*/

-- Create user_role enum type
CREATE TYPE user_role AS ENUM ('citizen', 'authority', 'admin', 'ngo');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  role user_role NOT NULL DEFAULT 'citizen',
  department text,
  is_verified boolean DEFAULT false,
  phone_notification_enabled boolean DEFAULT false,
  email_notification_enabled boolean DEFAULT true,
  is_phone_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Service role can manage all profiles
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    'citizen'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;