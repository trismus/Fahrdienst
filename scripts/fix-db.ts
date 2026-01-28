import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔧 Fixing database schema...\n');

  // Create profiles table if it doesn't exist
  const createProfilesSQL = `
    -- Create user_role enum if not exists
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('admin', 'operator', 'driver');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    -- Create profiles table
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      role user_role NOT NULL DEFAULT 'driver',
      display_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- Create policies
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    CREATE POLICY "Users can read own profile"
      ON profiles FOR SELECT
      TO authenticated
      USING (id = auth.uid());

    DROP POLICY IF EXISTS "Service role full access" ON profiles;
    CREATE POLICY "Service role full access"
      ON profiles FOR ALL
      TO service_role
      USING (true);
  `;

  const { error: profilesError } = await supabase.rpc('exec_sql', { sql: createProfilesSQL });

  if (profilesError) {
    // Try direct table creation approach
    console.log('Trying alternative approach...');

    // Check if we can insert into profiles
    const { error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: 'bdbbf386-d7b4-4d7a-9cc5-6e6306571cca',
        role: 'admin',
        display_name: 'Demo Dispatcher'
      }, { onConflict: 'id' });

    if (insertError) {
      console.log('❌ profiles:', insertError.message);
      console.log('\n⚠️  Bitte führe folgendes SQL manuell in Supabase aus:\n');
      console.log(createProfilesSQL);
    } else {
      console.log('✅ profiles: Dispatcher erstellt');
    }
  } else {
    console.log('✅ profiles table created');
  }

  // Add driver_code column if missing
  const { data: drivers } = await supabase.from('drivers').select('*').limit(1);

  if (drivers && drivers.length > 0) {
    const hasDriverCode = 'driver_code' in drivers[0];
    if (!hasDriverCode) {
      console.log('⚠️  driver_code column missing - needs manual fix');
    }
  }

  // Insert demo profiles directly
  console.log('\n📝 Erstelle Demo-Profile...');

  const profiles = [
    { id: 'bdbbf386-d7b4-4d7a-9cc5-6e6306571cca', role: 'admin', display_name: 'Demo Dispatcher' },
    { id: '20905f39-8062-411e-9b13-6560f5e7d19b', role: 'driver', display_name: 'Demo Fahrer' }
  ];

  for (const profile of profiles) {
    const { error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' });

    if (error) {
      console.log(`❌ ${profile.display_name}: ${error.message}`);
    } else {
      console.log(`✅ ${profile.display_name}: Profil erstellt (${profile.role})`);
    }
  }

  console.log('\n✅ Fertig!');
}

main().catch(console.error);
