/*
  # Add sample data for departments and create utility functions

  1. Updates
    - Add contact information to departments
    - Create utility functions for department management
    - Add sample data for testing

  2. Security
    - Maintains existing RLS policies
*/

-- Update departments with more contact information
UPDATE departments
SET 
  contact_person = CASE 
    WHEN name = 'Public Works' THEN 'Rajesh Kumar'
    WHEN name = 'Health' THEN 'Dr. Priya Sharma'
    WHEN name = 'Education' THEN 'Anand Verma'
    WHEN name = 'Transportation' THEN 'Vikram Singh'
    WHEN name = 'Utilities' THEN 'Meera Patel'
    WHEN name = 'Environment' THEN 'Sanjay Gupta'
    ELSE contact_person
  END,
  phone = CASE 
    WHEN name = 'Public Works' THEN '+91-9876543201'
    WHEN name = 'Health' THEN '+91-9876543202'
    WHEN name = 'Education' THEN '+91-9876543203'
    WHEN name = 'Transportation' THEN '+91-9876543204'
    WHEN name = 'Utilities' THEN '+91-9876543205'
    WHEN name = 'Environment' THEN '+91-9876543206'
    ELSE phone
  END,
  description = CASE
    WHEN name = 'Public Works' THEN 'Responsible for infrastructure development, maintenance of public buildings, roads, bridges, and other civic amenities.'
    WHEN name = 'Health' THEN 'Manages public health services, sanitation programs, and healthcare facilities for citizens.'
    WHEN name = 'Education' THEN 'Oversees educational institutions, literacy programs, and educational development initiatives.'
    WHEN name = 'Transportation' THEN 'Manages public transportation systems, traffic management, and road infrastructure planning.'
    WHEN name = 'Utilities' THEN 'Handles water supply, electricity distribution, waste management, and other essential utility services.'
    WHEN name = 'Environment' THEN 'Focuses on environmental protection, pollution control, and sustainable development initiatives.'
    ELSE description
  END;

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
END;
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
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assignment (commented out by default)
-- Uncomment to enable automatic department assignment
/*
CREATE TRIGGER auto_assign_complaint
  BEFORE INSERT ON complaints
  FOR EACH ROW
  WHEN (NEW.assigned_department IS NULL)
  EXECUTE FUNCTION auto_assign_complaint_to_department();
*/

-- Add sample data for testing (commented out)
-- These can be uncommented and used for testing purposes
/*
-- Sample citizen users would be created through the Auth API in a real application
-- This is just a reference for what the data would look like

-- Sample complaints
INSERT INTO complaints (user_id, category, subject, description, location, priority, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'sanitation', 'Garbage not collected', 'The garbage has not been collected for the past week.', 'Gandhi Nagar, Block 5', 'medium', 'pending'),
  ('00000000-0000-0000-0000-000000000001', 'infrastructure', 'Pothole on main road', 'Large pothole causing traffic issues and accidents.', 'MG Road near Central Market', 'high', 'inProgress'),
  ('00000000-0000-0000-0000-000000000002', 'utilities', 'Water supply disruption', 'No water supply for the past 3 days.', 'Shastri Nagar, Sector 7', 'urgent', 'escalated'),
  ('00000000-0000-0000-0000-000000000002', 'transportation', 'Bus stop damaged', 'The bus stop shelter is damaged and unsafe during rain.', 'Railway Station Road', 'medium', 'pending'),
  ('00000000-0000-0000-0000-000000000003', 'publicServices', 'Street lights not working', 'All street lights in our area are not functioning.', 'Indira Colony, Block C', 'medium', 'resolved');

-- Sample suggestions
INSERT INTO suggestions (user_id, title, description, category, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Install solar panels in government buildings', 'This will reduce electricity costs and promote renewable energy.', 'infrastructure', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'Weekly cleanliness drive', 'Organize weekly community cleanliness drives in each neighborhood.', 'sanitation', 'under_review'),
  ('00000000-0000-0000-0000-000000000003', 'Mobile app for bus tracking', 'Develop a mobile app to track public buses in real-time.', 'transportation', 'active');
*/