/*
  # Department Management System

  1. New Tables
    - `departments` - Store department information
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `email` (text, unique)
      - `description` (text)
      - `contact_person` (text)
      - `phone` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Views
    - `department_stats` - Department statistics view

  3. Functions
    - `get_department_statistics` - Get statistics for a department
    - `auto_assign_complaint_to_department` - Auto-assign complaints to departments
    - `assign_department_to_user` - Assign a department to a user

  4. Profile Enhancements
    - Add `is_phone_verified` column to profiles
    - Add `email_notification_enabled` column to profiles
*/

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

-- Add comment to departments table
COMMENT ON TABLE departments IS 'Department information for the SULABH system. To create authority users, use the Supabase Auth API or dashboard to create users, then assign departments using the assign_department_to_user function.';

-- Enable RLS on departments table
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
    -- Check if policy exists before dropping
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'departments' 
        AND policyname = 'Anyone can read departments'
    ) THEN
        DROP POLICY "Anyone can read departments" ON departments;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'departments' 
        AND policyname = 'Admins can manage departments'
    ) THEN
        DROP POLICY "Admins can manage departments" ON departments;
    END IF;
END $$;

-- Add policies for departments
CREATE POLICY "Anyone can read departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON departments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert initial departments if they don't exist
INSERT INTO departments (name, email, description)
SELECT 'Public Works', 'public-works@sulabh.gov.in', 'Infrastructure development and maintenance'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Public Works');

INSERT INTO departments (name, email, description)
SELECT 'Health', 'health@sulabh.gov.in', 'Public health services and sanitation'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Health');

INSERT INTO departments (name, email, description)
SELECT 'Education', 'education@sulabh.gov.in', 'Educational institutions and programs'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Education');

INSERT INTO departments (name, email, description)
SELECT 'Transportation', 'transportation@sulabh.gov.in', 'Public transportation and traffic management'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Transportation');

INSERT INTO departments (name, email, description)
SELECT 'Utilities', 'utilities@sulabh.gov.in', 'Water, electricity, and waste management'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Utilities');

INSERT INTO departments (name, email, description)
SELECT 'Environment', 'environment@sulabh.gov.in', 'Environmental protection and conservation'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Environment');

-- Create a function to get department statistics
CREATE OR REPLACE FUNCTION get_department_statistics(dept_name text)
RETURNS TABLE (
  total_complaints bigint,
  pending_complaints bigint,
  resolved_complaints bigint,
  avg_resolution_time numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(c.id) AS total_complaints,
    COUNT(c.id) FILTER (WHERE c.status IN ('pending', 'inProgress', 'escalated')) AS pending_complaints,
    COUNT(c.id) FILTER (WHERE c.status = 'resolved') AS resolved_complaints,
    COALESCE(
      AVG(
        EXTRACT(EPOCH FROM (c.resolved_at - c.submitted_at))/86400
      ) FILTER (WHERE c.status = 'resolved' AND c.resolved_at IS NOT NULL),
      0
    ) AS avg_resolution_time
  FROM
    complaints c
  WHERE
    c.assigned_department = dept_name;
END
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to assign complaints to departments automatically
CREATE OR REPLACE FUNCTION auto_assign_complaint_to_department()
RETURNS trigger AS $$
DECLARE
  dept_name text;
BEGIN
  -- Simple logic to assign based on category
  -- In a real system, this could be more sophisticated
  CASE NEW.category
    WHEN 'sanitation' THEN dept_name := 'Health';
    WHEN 'infrastructure' THEN dept_name := 'Public Works';
    WHEN 'publicServices' THEN 
      CASE 
        WHEN NEW.description ILIKE '%school%' OR NEW.description ILIKE '%education%' THEN dept_name := 'Education';
        ELSE dept_name := 'Public Works';
      END;
    WHEN 'utilities' THEN dept_name := 'Utilities';
    WHEN 'transportation' THEN dept_name := 'Transportation';
    WHEN 'other' THEN 
      -- For 'other', check description for keywords
      CASE
        WHEN NEW.description ILIKE '%environment%' OR NEW.description ILIKE '%pollution%' THEN dept_name := 'Environment';
        WHEN NEW.description ILIKE '%water%' OR NEW.description ILIKE '%electricity%' THEN dept_name := 'Utilities';
        WHEN NEW.description ILIKE '%road%' OR NEW.description ILIKE '%transport%' THEN dept_name := 'Transportation';
        ELSE dept_name := 'Public Works'; -- Default department
      END;
    ELSE dept_name := 'Public Works'; -- Default department
  END CASE;
  
  -- Update the complaint with the assigned department
  NEW.assigned_department := dept_name;
  
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Drop view if it exists
DROP VIEW IF EXISTS department_stats;

-- Create a view for department statistics
CREATE VIEW department_stats AS
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

-- Create a function to assign a department to a user
CREATE OR REPLACE FUNCTION assign_department_to_user(user_id uuid, dept_name text)
RETURNS void AS $$
BEGIN
  -- Check if department exists
  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = dept_name) THEN
    RAISE EXCEPTION 'Department % does not exist', dept_name;
  END IF;
  
  -- Update user's department and role
  UPDATE profiles
  SET 
    department = dept_name,
    role = 'authority'
  WHERE id = user_id;
END
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add is_phone_verified column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_phone_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_phone_verified boolean DEFAULT false;
  END IF;
END
$$;

-- Add email_notification_enabled column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_notification_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_notification_enabled boolean DEFAULT true;
  END IF;
END
$$;