/*
  # Create complaints table and related structures

  1. New Tables
    - `complaints`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `category` (enum)
      - `subject` (text)
      - `description` (text)
      - `location` (text)
      - `priority` (enum)
      - `status` (enum)
      - `assigned_to` (text, optional)
      - `assigned_department` (text, optional)
      - `attachments` (text array, optional)
      - `submitted_at` (timestamp)
      - `updated_at` (timestamp)
      - `resolved_at` (timestamp, optional)

    - `complaint_updates`
      - `id` (uuid, primary key)
      - `complaint_id` (uuid, references complaints)
      - `message` (text)
      - `status` (enum)
      - `updated_by` (uuid, references profiles)
      - `updated_at` (timestamp)
      - `attachments` (text array, optional)

    - `complaint_feedback`
      - `id` (uuid, primary key)
      - `complaint_id` (uuid, references complaints)
      - `rating` (integer, 1-5)
      - `comment` (text, optional)
      - `submitted_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for different user roles
*/

-- Create enums
CREATE TYPE complaint_category AS ENUM ('sanitation', 'infrastructure', 'publicServices', 'utilities', 'transportation', 'other');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE complaint_status AS ENUM ('pending', 'inProgress', 'resolved', 'escalated', 'closed');

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category complaint_category NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  priority complaint_priority NOT NULL DEFAULT 'medium',
  status complaint_status NOT NULL DEFAULT 'pending',
  assigned_to text,
  assigned_department text,
  attachments text[],
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create complaint_updates table
CREATE TABLE IF NOT EXISTS complaint_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  message text NOT NULL,
  status complaint_status NOT NULL,
  updated_by uuid NOT NULL REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now(),
  attachments text[]
);

-- Create complaint_feedback table
CREATE TABLE IF NOT EXISTS complaint_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid UNIQUE NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  submitted_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for complaints
CREATE POLICY "Users can read own complaints"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own complaints"
  ON complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own complaints"
  ON complaints
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authorities can read assigned complaints"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('authority', 'admin')
      AND (role = 'admin' OR department = assigned_department)
    )
  );

CREATE POLICY "Authorities can update assigned complaints"
  ON complaints
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('authority', 'admin')
      AND (role = 'admin' OR department = assigned_department)
    )
  );

CREATE POLICY "Public can read resolved complaints"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (status = 'resolved');

-- Policies for complaint_updates
CREATE POLICY "Users can read updates for own complaints"
  ON complaint_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaints
      WHERE id = complaint_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authorities can read updates for assigned complaints"
  ON complaint_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaints c
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = complaint_id 
      AND p.role IN ('authority', 'admin')
      AND (p.role = 'admin' OR p.department = c.assigned_department)
    )
  );

CREATE POLICY "Authorities can insert updates"
  ON complaint_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM complaints c
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = complaint_id 
      AND p.role IN ('authority', 'admin')
      AND (p.role = 'admin' OR p.department = c.assigned_department)
    )
  );

-- Policies for complaint_feedback
CREATE POLICY "Users can read feedback for own complaints"
  ON complaint_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaints
      WHERE id = complaint_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert feedback for own complaints"
  ON complaint_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM complaints
      WHERE id = complaint_id AND user_id = auth.uid() AND status = 'resolved'
    )
  );

CREATE POLICY "Authorities can read all feedback"
  ON complaint_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('authority', 'admin')
    )
  );

-- Triggers for updating timestamps
CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create initial update when complaint is created
CREATE OR REPLACE FUNCTION create_initial_complaint_update()
RETURNS trigger AS $$
BEGIN
  INSERT INTO complaint_updates (complaint_id, message, status, updated_by)
  VALUES (
    NEW.id,
    'Complaint submitted successfully',
    NEW.status,
    NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for creating initial update
CREATE TRIGGER on_complaint_created
  AFTER INSERT ON complaints
  FOR EACH ROW EXECUTE FUNCTION create_initial_complaint_update();

-- Function to update complaint status when update is added
CREATE OR REPLACE FUNCTION update_complaint_status()
RETURNS trigger AS $$
BEGIN
  UPDATE complaints 
  SET 
    status = NEW.status,
    updated_at = NEW.updated_at,
    resolved_at = CASE WHEN NEW.status = 'resolved' THEN NEW.updated_at ELSE resolved_at END
  WHERE id = NEW.complaint_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating complaint status
CREATE TRIGGER on_complaint_update_added
  AFTER INSERT ON complaint_updates
  FOR EACH ROW EXECUTE FUNCTION update_complaint_status();