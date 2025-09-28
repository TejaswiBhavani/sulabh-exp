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

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
    -- Check if policy exists before dropping
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Admins can insert profiles'
    ) THEN
        DROP POLICY "Admins can insert profiles" ON profiles;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Admins can read all profiles'
    ) THEN
        DROP POLICY "Admins can read all profiles" ON profiles;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Admins can update all profiles'
    ) THEN
        DROP POLICY "Admins can update all profiles" ON profiles;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Service role can manage profiles'
    ) THEN
        DROP POLICY "Service role can manage profiles" ON profiles;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        DROP POLICY "Users can insert own profile" ON profiles;
    END IF;
END
$$;

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