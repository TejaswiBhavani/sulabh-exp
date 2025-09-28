/*
  # Create suggestions and petitions system

  1. New Tables
    - `suggestions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `category` (enum)
      - `status` (enum)
      - `support_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `suggestion_supports`
      - `id` (uuid, primary key)
      - `suggestion_id` (uuid, references suggestions)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamp)

    - `suggestion_comments`
      - `id` (uuid, primary key)
      - `suggestion_id` (uuid, references suggestions)
      - `user_id` (uuid, references profiles)
      - `comment` (text)
      - `created_at` (timestamp)

    - `discussion_groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_by` (uuid, references profiles)
      - `is_ngo_group` (boolean)
      - `created_at` (timestamp)

    - `group_members`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references discussion_groups)
      - `user_id` (uuid, references profiles)
      - `role` (enum: member, moderator, admin)
      - `joined_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for public access and user management
*/

-- Create enums
CREATE TYPE suggestion_status AS ENUM ('active', 'under_review', 'implemented', 'rejected');
CREATE TYPE group_member_role AS ENUM ('member', 'moderator', 'admin');

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

-- Create discussion_groups table
CREATE TABLE IF NOT EXISTS discussion_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  is_ngo_group boolean DEFAULT false,
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

-- Enable RLS
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

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

-- Triggers for updating timestamps
CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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