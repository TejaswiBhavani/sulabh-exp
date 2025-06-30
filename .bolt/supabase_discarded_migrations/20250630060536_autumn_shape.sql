/*
  # Complaint Management Tables

  1. New Tables
    - `complaints` table to store complaint information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `category` (complaint_category enum)
      - `subject` (text)
      - `description` (text)
      - `location` (text)
      - `priority` (complaint_priority enum, default 'medium')
      - `status` (complaint_status enum, default 'pending')
      - `assigned_to` (text, nullable)
      - `assigned_department` (text, nullable)
      - `attachments` (text[], nullable)
      - `submitted_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `resolved_at` (timestamptz, nullable)
    
    - `complaint_updates` table to store updates to complaints
      - `id` (uuid, primary key)
      - `complaint_id` (uuid, references complaints)
      - `message` (text)
      - `status` (complaint_status enum)
      - `updated_by` (uuid, references profiles)
      - `updated_at` (timestamptz, default now())
      - `attachments` (text[], nullable)
    
    - `complaint_feedback` table to store feedback on resolved complaints
      - `id` (uuid, primary key)
      - `complaint_id` (uuid, references complaints, unique)
      - `rating` (integer, 1-5)
      - `comment` (text, nullable)
      - `submitted_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Create triggers for status updates and notifications
*/

-- Create enum types
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

-- Enable Row Level Security
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_feedback ENABLE ROW LEVEL SECURITY;

-- Complaint policies
-- Users can insert their own complaints
CREATE POLICY "Users can insert own complaints"
  ON complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can read their own complaints
CREATE POLICY "Users can read own complaints"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own complaints
CREATE POLICY "Users can update own complaints"
  ON complaints
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Authorities can read assigned complaints
CREATE POLICY "Authorities can read assigned complaints"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('authority', 'admin')
      AND (profiles.role = 'admin' OR profiles.department = complaints.assigned_department)
    )
  );

-- Authorities can update assigned complaints
CREATE POLICY "Authorities can update assigned complaints"
  ON complaints
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('authority', 'admin')
      AND (profiles.role = 'admin' OR profiles.department = complaints.assigned_department)
    )
  );

-- Public can read resolved complaints
CREATE POLICY "Public can read resolved complaints"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (status = 'resolved');

-- Complaint updates policies
-- Users can read updates for own complaints
CREATE POLICY "Users can read updates for own complaints"
  ON complaint_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaints
      WHERE complaints.id = complaint_updates.complaint_id
      AND complaints.user_id = auth.uid()
    )
  );

-- Authorities can read updates for assigned complaints
CREATE POLICY "Authorities can read updates for assigned complaints"
  ON complaint_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaints c
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = complaint_updates.complaint_id
      AND p.role IN ('authority', 'admin')
      AND (p.role = 'admin' OR p.department = c.assigned_department)
    )
  );

-- Authorities can insert updates
CREATE POLICY "Authorities can insert updates"
  ON complaint_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM complaints c
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = complaint_updates.complaint_id
      AND p.role IN ('authority', 'admin')
      AND (p.role = 'admin' OR p.department = c.assigned_department)
    )
  );

-- Complaint feedback policies
-- Users can insert feedback for own resolved complaints
CREATE POLICY "Users can insert feedback for own complaints"
  ON complaint_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM complaints
      WHERE complaints.id = complaint_feedback.complaint_id
      AND complaints.user_id = auth.uid()
      AND complaints.status = 'resolved'
    )
  );

-- Users can read feedback for own complaints
CREATE POLICY "Users can read feedback for own complaints"
  ON complaint_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaints
      WHERE complaints.id = complaint_feedback.complaint_id
      AND complaints.user_id = auth.uid()
    )
  );

-- Authorities can read all feedback
CREATE POLICY "Authorities can read all feedback"
  ON complaint_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('authority', 'admin')
    )
  );

-- Create trigger to update updated_at column
CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function to create initial complaint update
CREATE OR REPLACE FUNCTION create_initial_complaint_update()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to add initial update when complaint is created
CREATE TRIGGER on_complaint_created
  AFTER INSERT ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_complaint_update();

-- Create trigger function to update complaint status
CREATE OR REPLACE FUNCTION update_complaint_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE complaints
  SET 
    status = NEW.status,
    updated_at = now(),
    resolved_at = CASE WHEN NEW.status = 'resolved' AND complaints.resolved_at IS NULL 
                      THEN now() 
                      ELSE complaints.resolved_at 
                  END
  WHERE id = NEW.complaint_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update complaint status when update is added
CREATE TRIGGER on_complaint_update_added
  AFTER INSERT ON complaint_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_complaint_status();

-- Create trigger function to send notification on complaint update
CREATE OR REPLACE FUNCTION send_complaint_notification()
RETURNS TRIGGER AS $$
DECLARE
  complaint_subject text;
  complaint_user_id uuid;
BEGIN
  -- Get complaint details
  SELECT subject, user_id INTO complaint_subject, complaint_user_id
  FROM complaints
  WHERE id = NEW.complaint_id;
  
  -- Insert notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    is_read
  ) VALUES (
    complaint_user_id,
    'complaint_update',
    'Complaint Update: ' || complaint_subject,
    'Your complaint has been updated to status: ' || NEW.status || '. Message: ' || NEW.message,
    NEW.complaint_id,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to send notification when update is added
CREATE TRIGGER on_complaint_update_notification
  AFTER INSERT ON complaint_updates
  FOR EACH ROW
  EXECUTE FUNCTION send_complaint_notification();

-- Create trigger function to send escalation notification
CREATE OR REPLACE FUNCTION send_escalation_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send notification if status changed to escalated
  IF NEW.status = 'escalated' AND OLD.status != 'escalated' THEN
    -- Insert notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      is_read
    ) VALUES (
      NEW.user_id,
      'complaint_escalated',
      'Complaint Escalated: ' || NEW.subject,
      'Your complaint has been escalated for priority attention.',
      NEW.id,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to send notification when complaint is escalated
CREATE TRIGGER on_complaint_status_change_notification
  AFTER UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION send_escalation_notification();

-- Create trigger function to auto-assign complaint department
CREATE OR REPLACE FUNCTION auto_assign_complaint_department()
RETURNS TRIGGER AS $$
DECLARE
  dept_name text;
BEGIN
  -- Assign department based on category
  CASE NEW.category
    WHEN 'sanitation' THEN dept_name := 'Sanitation Department';
    WHEN 'infrastructure' THEN dept_name := 'Public Works Department';
    WHEN 'publicServices' THEN dept_name := 'Public Services Department';
    WHEN 'utilities' THEN dept_name := 'Utilities Department';
    WHEN 'transportation' THEN dept_name := 'Transportation Department';
    ELSE dept_name := 'General Administration';
  END CASE;
  
  -- Update the complaint with the assigned department
  NEW.assigned_department := dept_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign department when complaint is created
CREATE TRIGGER on_complaint_created_assign_department
  BEFORE INSERT ON complaints
  FOR EACH ROW
  WHEN (NEW.assigned_department IS NULL)
  EXECUTE FUNCTION auto_assign_complaint_department();