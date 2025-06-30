/*
  # Add notifications and file storage support

  1. New Tables
    - `notifications` - Store user notifications
    - `file_uploads` - Track uploaded files
  
  2. Storage
    - Create storage buckets for file uploads
  
  3. Security
    - Enable RLS on new tables
    - Add policies for notifications and file access
*/

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

-- Create file_uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  bucket_name text NOT NULL,
  related_type text, -- 'complaint', 'suggestion', etc.
  related_id uuid,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for file_uploads
CREATE POLICY "Users can read own files"
  ON file_uploads
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own files"
  ON file_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own files"
  ON file_uploads
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authorities can read files for assigned complaints"
  ON file_uploads
  FOR SELECT
  TO authenticated
  USING (
    related_type = 'complaint' AND
    EXISTS (
      SELECT 1 FROM complaints c
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = file_uploads.related_id::uuid
      AND p.role IN ('authority', 'admin')
      AND (p.role = 'admin' OR p.department = c.assigned_department)
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_related ON file_uploads(related_type, related_id);

-- Create storage buckets (these need to be created via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES 
--   ('complaint-attachments', 'complaint-attachments', true),
--   ('profile-pictures', 'profile-pictures', true),
--   ('system-files', 'system-files', false);

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