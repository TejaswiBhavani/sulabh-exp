/*
  # Additional System Tables

  1. New Tables
    - `discussion_groups` table for community discussions
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_by` (uuid, references profiles)
      - `is_ngo_group` (boolean, default false)
      - `metadata` (jsonb, nullable)
      - `created_at` (timestamptz, default now())
    
    - `group_members` table to track group membership
      - `id` (uuid, primary key)
      - `group_id` (uuid, references discussion_groups)
      - `user_id` (uuid, references profiles)
      - `role` (group_member_role enum, default 'member')
      - `joined_at` (timestamptz, default now())
    
    - `sms_logs` table to track SMS notifications
      - `id` (uuid, primary key)
      - `phone_number` (text)
      - `message` (text)
      - `complaint_id` (uuid, references complaints, nullable)
      - `user_id` (uuid, references profiles, nullable)
      - `message_id` (text, nullable)
      - `status` (text, nullable)
      - `sent_at` (timestamptz, default now())
    
    - `cache` table for caching data
      - `key` (text, primary key)
      - `data` (jsonb)
      - `created_at` (timestamptz, default now())
    
    - `departments` table for system departments
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `email` (text, unique)
      - `description` (text, nullable)
      - `contact_person` (text, nullable)
      - `phone` (text, nullable)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Create triggers for group membership
*/

-- Create enum type for group member role
CREATE TYPE group_member_role AS ENUM ('member', 'moderator', 'admin');

-- Create discussion_groups table
CREATE TABLE IF NOT EXISTS discussion_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  is_ngo_group boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES discussion_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role group_member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create sms_logs table
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

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  description text,
  contact_person text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE departments IS 'Department information for the SULABH system. To create authority users, use the Supabase Auth API or dashboard to create users, then assign departments using the assign_department_to_user function.';

-- Enable Row Level Security
ALTER TABLE discussion_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Discussion groups policies
-- Anyone can read groups
CREATE POLICY "Anyone can read groups"
  ON discussion_groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can create groups
CREATE POLICY "Users can create groups"
  ON discussion_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Group creators can update groups
CREATE POLICY "Group creators can update groups"
  ON discussion_groups
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Group members policies
-- Anyone can read group members
CREATE POLICY "Anyone can read group members"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can join groups
CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can leave groups
CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Group admins can manage members
CREATE POLICY "Group admins can manage members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('admin', 'moderator')
    )
  );

-- SMS logs policies
-- Admin can read SMS logs
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

-- Service role can manage SMS logs
CREATE POLICY "Service role can manage SMS logs"
  ON sms_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Cache policies
-- Service role can manage cache
CREATE POLICY "Service role can manage cache"
  ON cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Departments policies
-- Anyone can read departments
CREATE POLICY "Anyone can read departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage departments
CREATE POLICY "Admins can manage departments"
  ON departments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create trigger function to add group creator as admin
CREATE OR REPLACE FUNCTION add_group_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add group creator as admin
CREATE TRIGGER on_group_created
  AFTER INSERT ON discussion_groups
  FOR EACH ROW
  EXECUTE FUNCTION add_group_creator_as_admin();

-- Create department_stats view
CREATE OR REPLACE VIEW department_stats AS
SELECT 
  d.name,
  d.email,
  d.description,
  COUNT(p.id) AS assigned_users
FROM 
  departments d
LEFT JOIN 
  profiles p ON p.department = d.name
GROUP BY 
  d.name, d.email, d.description;