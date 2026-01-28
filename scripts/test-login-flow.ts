import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

async function main() {
  // Use anon key like the app does
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  console.log('🔐 Testing login flow...\n');

  // 1. Login as dispatcher
  console.log('1. Signing in as dispatcher...');
  const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'dispatcher@demo.fahrdienst.ch',
    password: 'Demo1234!'
  });

  if (loginError) {
    console.log(`   ❌ Login failed: ${loginError.message}`);
    return;
  }
  console.log(`   ✅ Logged in as: ${session.user?.email}`);
  console.log(`   User ID: ${session.user?.id}`);

  // 2. Try to get user
  console.log('\n2. Getting user with getUser()...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.log(`   ❌ getUser failed: ${userError.message}`);
  } else {
    console.log(`   ✅ Got user: ${user?.email}`);
  }

  // 3. Try to read profile
  console.log('\n3. Reading profile from profiles table...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user!.id)
    .single();

  if (profileError) {
    console.log(`   ❌ Profile read failed: ${profileError.message}`);
    console.log(`   Code: ${profileError.code}`);
    console.log(`   Details: ${profileError.details}`);
  } else {
    console.log(`   ✅ Profile read successful!`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Display Name: ${profile.display_name}`);
  }

  // 4. Try to read patients (requires admin/operator)
  console.log('\n4. Reading patients...');
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('id, name')
    .limit(3);

  if (patientsError) {
    console.log(`   ❌ Patients read failed: ${patientsError.message}`);
  } else {
    console.log(`   ✅ Read ${patients?.length} patients`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error);
