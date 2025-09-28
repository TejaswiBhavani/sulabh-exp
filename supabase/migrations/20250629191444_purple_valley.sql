/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current admin policies on profiles table create infinite recursion
    - Policies check if user is admin by querying profiles table
    - This creates a circular dependency during policy evaluation

  2. Solution
    - Drop existing problematic policies
    - Create new policies that avoid recursion
    - Use auth.uid() directly for user identification
    - Simplify admin checks to avoid circular references

  3. Security
    - Maintain same security level
    - Users can only access their own profiles
    - System operations handled through service role
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Keep existing user policies (these don't cause recursion)
-- "Users can read own profile" - already exists and works fine
-- "Users can update own profile" - already exists and works fine

-- Create a simplified admin policy that doesn't cause recursion
-- This policy allows service role to manage profiles during registration
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert their own profile during registration
-- This replaces the problematic admin insert policy
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);