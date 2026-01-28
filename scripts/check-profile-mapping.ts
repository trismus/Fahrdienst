import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('========================================');
  console.log('PROFILE MAPPING CHECK');
  console.log('========================================\n');

  // Get all users from auth
  const { data: users } = await supabase.auth.admin.listUsers();

  console.log('Auth Users:');
  for (const user of users?.users || []) {
    console.log('  - ' + user.email + ' (ID: ' + user.id + ')');
  }

  // Get all profiles (service role bypasses RLS)
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*');

  console.log('\nProfiles:');
  if (profileError) {
    console.log('  Error: ' + profileError.message);
  } else {
    for (const profile of profiles || []) {
      console.log('  - ID: ' + profile.id);
      console.log('    Role: ' + profile.role);
      console.log('    Display Name: ' + profile.display_name);
    }
  }

  // Check mapping
  console.log('\nUser-Profile Mapping:');
  const dispatcherUser = users?.users?.find(u => u.email === 'dispatcher@demo.fahrdienst.ch');
  const fahrerUser = users?.users?.find(u => u.email === 'fahrer@demo.fahrdienst.ch');

  if (dispatcherUser) {
    const dispatcherProfile = profiles?.find(p => p.id === dispatcherUser.id);
    console.log('\n  Dispatcher (' + dispatcherUser.email + '):');
    console.log('    User ID: ' + dispatcherUser.id);
    if (dispatcherProfile) {
      console.log('    Profile Role: ' + dispatcherProfile.role);
      const isCorrect = dispatcherProfile.role === 'admin';
      console.log('    Mapping korrekt: ' + (isCorrect ? 'JA' : 'NEIN - sollte admin sein!'));
    } else {
      console.log('    Kein Profil gefunden!');
    }
  }

  if (fahrerUser) {
    const fahrerProfile = profiles?.find(p => p.id === fahrerUser.id);
    console.log('\n  Fahrer (' + fahrerUser.email + '):');
    console.log('    User ID: ' + fahrerUser.id);
    if (fahrerProfile) {
      console.log('    Profile Role: ' + fahrerProfile.role);
      const isCorrect = fahrerProfile.role === 'driver';
      console.log('    Mapping korrekt: ' + (isCorrect ? 'JA' : 'NEIN - sollte driver sein!'));
    } else {
      console.log('    Kein Profil gefunden!');
    }
  }

  // Test dispatcher login and profile read
  console.log('\n========================================');
  console.log('RLS POLICY TEST');
  console.log('========================================\n');

  // Test dispatcher login
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'dispatcher@demo.fahrdienst.ch',
    password: 'Demo1234!'
  });

  if (loginError) {
    console.log('Dispatcher Login fehlgeschlagen: ' + loginError.message);
  } else {
    console.log('Dispatcher Login erfolgreich');
    console.log('User ID: ' + loginData.user?.id);

    // Try to read profile with user session (using anon key + user token)
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: 'Bearer ' + loginData.session?.access_token
          }
        }
      }
    );

    const { data: userProfile, error: profileReadError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', loginData.user?.id)
      .single();

    if (profileReadError) {
      console.log('\nProfile-Lesen fehlgeschlagen: ' + profileReadError.message);
      console.log('Code: ' + profileReadError.code);

      if (profileReadError.message.includes('infinite recursion')) {
        console.log('\n!!! RLS RECURSION PROBLEM NOCH VORHANDEN !!!');
        console.log('');
        console.log('Bitte fuehre folgendes SQL im Supabase SQL Editor aus:');
        console.log('-----------------------------------------------------');
        console.log('DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;');
        console.log('-----------------------------------------------------');
      }
    } else {
      console.log('\nProfile erfolgreich gelesen:');
      console.log('  Role: ' + userProfile.role);
      console.log('  Display Name: ' + userProfile.display_name);

      if (userProfile.role === 'admin') {
        console.log('\n>>> Dispatcher hat korrektes admin-Profil!');
        console.log('>>> Das Mapping ist korrekt.');
      } else {
        console.log('\n!!! PROBLEM: Dispatcher hat role=' + userProfile.role + ' statt admin!');
      }
    }
  }

  console.log('\n========================================');
}

main().catch(console.error);
