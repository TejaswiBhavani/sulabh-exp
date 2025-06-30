/*
  # Sample Data Migration

  This migration creates sample data for testing purposes without violating foreign key constraints.
  Instead of inserting directly into profiles with non-existent auth.users IDs,
  we'll create a separate table for department information.
*/

-- Create a departments table to store department information
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

-- Enable RLS on departments table
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create policy for reading departments
CREATE POLICY "Anyone can read departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for admins to manage departments
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

-- Insert sample departments
INSERT INTO departments (name, email, description)
VALUES
  ('Public Works', 'public-works@sulabh.gov.in', 'Responsible for infrastructure and public facilities'),
  ('Health', 'health@sulabh.gov.in', 'Manages public health services and sanitation'),
  ('Education', 'education@sulabh.gov.in', 'Oversees educational institutions and services'),
  ('Transportation', 'transportation@sulabh.gov.in', 'Manages public transportation and road infrastructure'),
  ('Utilities', 'utilities@sulabh.gov.in', 'Handles water, electricity, and other utility services'),
  ('Environment', 'environment@sulabh.gov.in', 'Focuses on environmental protection and sustainability');

-- Add a function to assign department to user
CREATE OR REPLACE FUNCTION assign_department_to_user(
  user_id uuid,
  department_name text
)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET department = department_name
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to create authority user (for admin use)
CREATE OR REPLACE FUNCTION create_authority_user(
  email text,
  first_name text,
  last_name text,
  department_name text
)
RETURNS text AS $$
DECLARE
  temp_password text;
BEGIN
  -- In a real implementation, this would create an auth user
  -- and then update the profile with department info
  temp_password := 'This is a placeholder function. In production, this would create a real user.';
  RETURN temp_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to show departments with their assigned users count
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
  d.id, d.name, d.email, d.description;

-- Add a comment explaining how to properly create users
COMMENT ON TABLE departments IS 'Department information for the SULABH system. To create authority users, use the Supabase Auth API or dashboard to create users, then assign departments using the assign_department_to_user function.';