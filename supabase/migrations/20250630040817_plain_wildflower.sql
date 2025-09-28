/*
  # Row Level Security Policies

  This migration adds Row Level Security (RLS) policies to all tables
  to ensure proper data access control based on user roles.
*/

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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

-- Policies for suggestions (public read, authenticated write)
CREATE POLICY "Anyone can read suggestions"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create suggestions"
  ON suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own suggestions"
  ON suggestions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update all suggestions"
  ON suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for suggestion_supports
CREATE POLICY "Anyone can read supports"
  ON suggestion_supports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can support suggestions"
  ON suggestion_supports
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own support"
  ON suggestion_supports
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for suggestion_comments
CREATE POLICY "Anyone can read comments"
  ON suggestion_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON suggestion_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON suggestion_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

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

-- Policies for discussion_groups
CREATE POLICY "Anyone can read groups"
  ON discussion_groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create groups"
  ON discussion_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can update groups"
  ON discussion_groups
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Policies for group_members
CREATE POLICY "Anyone can read group members"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

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

-- Policies for cache
CREATE POLICY "Service role can manage cache" 
  ON cache 
  FOR ALL 
  TO service_role 
  USING (true);

-- Policies for sms_logs
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