-- =============================================================================
-- FIX: Create profiles table and demo user profiles
-- Run this in Supabase SQL Editor
-- =============================================================================

-- 1. Create user_role enum if not exists
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'operator', 'driver');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'driver',
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Service role full access" ON profiles;
CREATE POLICY "Service role full access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Insert demo user profiles
-- Replace these UUIDs with the actual user IDs from auth.users if different
INSERT INTO profiles (id, role, display_name)
SELECT id, 'admin', 'Demo Dispatcher'
FROM auth.users
WHERE email = 'dispatcher@demo.fahrdienst.ch'
ON CONFLICT (id) DO UPDATE SET role = 'admin', display_name = 'Demo Dispatcher';

INSERT INTO profiles (id, role, display_name)
SELECT id, 'driver', 'Demo Fahrer'
FROM auth.users
WHERE email = 'fahrer@demo.fahrdienst.ch'
ON CONFLICT (id) DO UPDATE SET role = 'driver', display_name = 'Demo Fahrer';

-- 6. Verify
SELECT
  u.email,
  p.role,
  p.display_name
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email LIKE '%demo.fahrdienst.ch';
