import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔍 Checking dispatcher user...\n');

  // 1. Check auth.users
  const { data: users } = await supabase.auth.admin.listUsers();
  const dispatcher = users?.users?.find(u => u.email === 'dispatcher@demo.fahrdienst.ch');

  if (!dispatcher) {
    console.log('❌ Dispatcher user not found in auth.users');
    console.log('   Run: npx tsx scripts/seed-demo-users.ts');
    return;
  }

  console.log('✅ Auth user found:');
  console.log(`   ID: ${dispatcher.id}`);
  console.log(`   Email: ${dispatcher.email}`);
  console.log(`   Confirmed: ${dispatcher.email_confirmed_at ? 'Yes' : 'No'}`);

  // 2. Check profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', dispatcher.id)
    .single();

  if (profileError) {
    console.log(`\n❌ Profile error: ${profileError.message}`);
    console.log('   Creating profile...');

    const { error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: dispatcher.id,
        role: 'admin',
        display_name: 'Demo Dispatcher'
      });

    if (insertError) {
      console.log(`   ❌ Failed to create profile: ${insertError.message}`);
    } else {
      console.log('   ✅ Profile created!');
    }
  } else {
    console.log('\n✅ Profile found:');
    console.log(`   Role: ${profile.role}`);
    console.log(`   Display Name: ${profile.display_name}`);
  }

  // 3. Test login
  console.log('\n🔐 Testing login...');
  const demoPassword = process.env.DEMO_USER_PASSWORD;
  if (!demoPassword) {
    console.log('⚠️  DEMO_USER_PASSWORD nicht gesetzt - Login-Test übersprungen');
    return;
  }
  const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'dispatcher@demo.fahrdienst.ch',
    password: demoPassword
  });

  if (loginError) {
    console.log(`❌ Login failed: ${loginError.message}`);
  } else {
    console.log('✅ Login successful!');
    console.log(`   Session user: ${session.user?.email}`);
  }

  // 4. Check RLS policies
  console.log('\n📋 Testing data access with user session...');

  // Create client with user token
  if (session?.session) {
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`
          }
        }
      }
    );

    const { data: patients, error: patientsError } = await userClient
      .from('patients')
      .select('id, name')
      .limit(3);

    if (patientsError) {
      console.log(`❌ Cannot read patients: ${patientsError.message}`);
    } else {
      console.log(`✅ Can read patients: ${patients?.length} found`);
    }

    const { data: userProfile, error: userProfileError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', dispatcher.id)
      .single();

    if (userProfileError) {
      console.log(`❌ Cannot read own profile: ${userProfileError.message}`);
    } else {
      console.log(`✅ Can read own profile: role=${userProfile.role}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error);
