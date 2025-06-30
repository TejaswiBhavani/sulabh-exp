/*
  # Insert sample data for testing

  This migration adds sample data for:
  - Departments
  - Admin user
  - Authority users
  - Sample complaints
  - Sample suggestions
*/

-- Insert sample departments
INSERT INTO profiles (id, email, first_name, last_name, role, department, is_verified)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@sulabh.gov.in', 'System', 'Administrator', 'admin', NULL, true),
  ('00000000-0000-0000-0000-000000000002', 'public-works@sulabh.gov.in', 'Public Works', 'Department', 'authority', 'Public Works', true),
  ('00000000-0000-0000-0000-000000000003', 'health@sulabh.gov.in', 'Health', 'Department', 'authority', 'Health', true),
  ('00000000-0000-0000-0000-000000000004', 'education@sulabh.gov.in', 'Education', 'Department', 'authority', 'Education', true),
  ('00000000-0000-0000-0000-000000000005', 'transportation@sulabh.gov.in', 'Transportation', 'Department', 'authority', 'Transportation', true),
  ('00000000-0000-0000-0000-000000000006', 'utilities@sulabh.gov.in', 'Utilities', 'Department', 'authority', 'Utilities', true),
  ('00000000-0000-0000-0000-000000000007', 'environment@sulabh.gov.in', 'Environment', 'Department', 'authority', 'Environment', true),
  ('00000000-0000-0000-0000-000000000008', 'ngo@example.org', 'Community', 'NGO', 'ngo', NULL, true);

-- Note: In a real implementation, you would need to create auth.users entries for these accounts
-- and set up proper authentication. This is just for demonstration purposes.

-- The following commented code shows how you would typically create these users
-- through the Supabase Auth API rather than direct database insertion:

/*
-- Create admin user
SELECT supabase_auth.create_user(
  'admin@sulabh.gov.in',
  'StrongPassword123',
  '{"first_name":"System","last_name":"Administrator"}'::jsonb,
  '{"role":"admin"}'::jsonb
);

-- Create authority users
SELECT supabase_auth.create_user(
  'public-works@sulabh.gov.in',
  'StrongPassword123',
  '{"first_name":"Public Works","last_name":"Department"}'::jsonb,
  '{"role":"authority","department":"Public Works"}'::jsonb
);

-- And so on for other users...
*/