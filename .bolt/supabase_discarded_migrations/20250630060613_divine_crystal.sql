/*
  # Suggestion System Tables

  1. New Tables
    - `suggestions` table to store community suggestions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `category` (complaint_category enum)
      - `status` (suggestion_status enum, default 'active')
      - `support_count` (integer, default 0)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `suggestion_supports` table to track user support for suggestions
      - `id` (uuid, primary key)
      - `suggestion_id` (uuid, references suggestions)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz, default now())
    
    - `suggestion_comments` table to store comments on suggestions
      - `id` (uuid, primary key)
      - `suggestion_id` (uuid, references suggestions)
      - `user_id` (uuid, references profiles)
      - `comment` (text)
      - `created_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Create triggers for support count updates
*/

-- Create enum type for suggestion status
CREATE TYPE suggestion_status AS ENUM ('active', 'under_review', 'implemented', 'rejected');

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

-- Enable Row Level Security
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_comments ENABLE ROW LEVEL SECURITY;

-- Suggestions policies
-- Anyone can read suggestions
CREATE POLICY "Anyone can read suggestions"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can create suggestions
CREATE POLICY "Users can create suggestions"
  ON suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update own suggestions
CREATE POLICY "Users can update own suggestions"
  ON suggestions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can update all suggestions
CREATE POLICY "Admins can update all suggestions"
  ON suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Suggestion supports policies
-- Anyone can read supports
CREATE POLICY "Anyone can read supports"
  ON suggestion_supports
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can support suggestions
CREATE POLICY "Users can support suggestions"
  ON suggestion_supports
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can remove own support
CREATE POLICY "Users can remove own support"
  ON suggestion_supports
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Suggestion comments policies
-- Anyone can read comments
CREATE POLICY "Anyone can read comments"
  ON suggestion_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can create comments
CREATE POLICY "Users can create comments"
  ON suggestion_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update own comments
CREATE POLICY "Users can update own comments"
  ON suggestion_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create trigger to update updated_at column
CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function to update suggestion support count
CREATE OR REPLACE FUNCTION update_suggestion_support_count()
RETURNS TRIGGER AS $$
DECLARE
  support_count integer;
BEGIN
  -- Count the number of supports for this suggestion
  SELECT COUNT(*) INTO support_count
  FROM suggestion_supports
  WHERE suggestion_id = COALESCE(NEW.suggestion_id, OLD.suggestion_id);
  
  -- Update the suggestion's support_count
  UPDATE suggestions
  SET support_count = support_count
  WHERE id = COALESCE(NEW.suggestion_id, OLD.suggestion_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update support count
CREATE TRIGGER on_suggestion_support_added
  AFTER INSERT ON suggestion_supports
  FOR EACH ROW
  EXECUTE FUNCTION update_suggestion_support_count();

CREATE TRIGGER on_suggestion_support_removed
  AFTER DELETE ON suggestion_supports
  FOR EACH ROW
  EXECUTE FUNCTION update_suggestion_support_count();