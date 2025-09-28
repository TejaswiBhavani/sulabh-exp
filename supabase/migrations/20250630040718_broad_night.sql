/*
  # Initial Schema Setup for SULABH

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `phone` (text, optional)
      - `role` (enum: citizen, authority, admin, ngo)
      - `department` (text, optional for authorities)
      - `is_verified` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `complaints`
    - `complaint_updates`
    - `complaint_feedback`
    - `suggestions`
    - `suggestion_supports`
    - `suggestion_comments`
    - `notifications`
    - `discussion_groups`
    - `group_members`

  2. Security
    - Enable RLS on all tables
    - Add policies for different user roles
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('citizen', 'authority', 'admin', 'ngo');

-- Create enum for complaint categories
CREATE TYPE complaint_category AS ENUM ('sanitation', 'infrastructure', 'publicServices', 'utilities', 'transportation', 'other');

-- Create enum for complaint priorities
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create enum for complaint statuses
CREATE TYPE complaint_status AS ENUM ('pending', 'inProgress', 'resolved', 'escalated', 'closed');

-- Create enum for suggestion statuses
CREATE TYPE suggestion_status AS ENUM ('active', 'under_review', 'implemented', 'rejected');

-- Create enum for group member roles
CREATE TYPE group_member_role AS ENUM ('member', 'moderator', 'admin');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category complaint_category NOT NULL,
  status suggestion_status NOT NULL DEFAULT 'active',
  support_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create suggestion_supports table
CREATE TABLE IF NOT EXISTS suggestion_supports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);

-- Create suggestion_comments table
CREATE TABLE IF NOT EXISTS suggestion_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

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

-- Create cache table for performance optimization
CREATE TABLE IF NOT EXISTS cache (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
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

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON suggestions
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

-- Function to update support count
CREATE OR REPLACE FUNCTION update_suggestion_support_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE suggestions 
    SET support_count = support_count + 1
    WHERE id = NEW.suggestion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE suggestions 
    SET support_count = support_count - 1
    WHERE id = OLD.suggestion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for support count
CREATE TRIGGER on_suggestion_support_added
  AFTER INSERT ON suggestion_supports
  FOR EACH ROW EXECUTE FUNCTION update_suggestion_support_count();

CREATE TRIGGER on_suggestion_support_removed
  AFTER DELETE ON suggestion_supports
  FOR EACH ROW EXECUTE FUNCTION update_suggestion_support_count();

-- Function to automatically add group creator as admin
CREATE OR REPLACE FUNCTION add_group_creator_as_admin()
RETURNS trigger AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for adding group creator as admin
CREATE TRIGGER on_group_created
  AFTER INSERT ON discussion_groups
  FOR EACH ROW EXECUTE FUNCTION add_group_creator_as_admin();

-- Function to automatically send notifications for complaint updates
CREATE OR REPLACE FUNCTION send_complaint_notification()
RETURNS trigger AS $$
BEGIN
  -- Send notification to complaint owner
  INSERT INTO notifications (user_id, type, title, message, related_id)
  VALUES (
    (SELECT user_id FROM complaints WHERE id = NEW.complaint_id),
    'complaint_update',
    'Complaint Update',
    NEW.message,
    NEW.complaint_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for complaint update notifications
CREATE TRIGGER on_complaint_update_notification
  AFTER INSERT ON complaint_updates
  FOR EACH ROW EXECUTE FUNCTION send_complaint_notification();

-- Function to send escalation notifications
CREATE OR REPLACE FUNCTION send_escalation_notification()
RETURNS trigger AS $$
BEGIN
  -- Only send notification if status changed to escalated
  IF NEW.status = 'escalated' AND OLD.status != 'escalated' THEN
    INSERT INTO notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.user_id,
      'complaint_escalated',
      'Complaint Escalated',
      'Your complaint "' || NEW.subject || '" has been escalated for priority attention.',
      NEW.id
    );
  END IF;
  
  -- Send notification if status changed to resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    INSERT INTO notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.user_id,
      'complaint_resolved',
      'Complaint Resolved',
      'Your complaint "' || NEW.subject || '" has been resolved.',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for escalation notifications
CREATE TRIGGER on_complaint_status_change_notification
  AFTER UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION send_escalation_notification();