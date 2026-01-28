/**
 * Demo User Seeding Script
 *
 * Creates demo users in Supabase Auth and configures their profiles.
 *
 * Prerequisites:
 * - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * - Run: npx tsx scripts/seed-demo-users.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
config({ path: '.env.local' });

// Configuration
const DEMO_USERS = [
  {
    email: 'dispatcher@demo.fahrdienst.ch',
    password: 'Demo1234!',
    role: 'admin' as const,
    displayName: 'Demo Dispatcher',
  },
  {
    email: 'fahrer@demo.fahrdienst.ch',
    password: 'Demo1234!',
    role: 'driver' as const,
    displayName: 'Demo Fahrer',
    linkToDriver: 'TEST-DRV-01', // Will link to this driver_code
  },
];

async function main() {
  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_URL nicht gesetzt');
    console.error('   Füge diese zu .env.local hinzu');
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY nicht gesetzt');
    console.error('   Finde den Key in Supabase Dashboard → Settings → API → service_role');
    console.error('   Füge ihn zu .env.local hinzu: SUPABASE_SERVICE_ROLE_KEY=...');
    process.exit(1);
  }

  // Create admin client with service role
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('🚀 Demo-User Setup gestartet...\n');

  for (const user of DEMO_USERS) {
    console.log(`📧 Erstelle User: ${user.email}`);

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === user.email);

    let userId: string;

    if (existingUser) {
      console.log(`   ⚠️  User existiert bereits (ID: ${existingUser.id})`);
      userId = existingUser.id;

      // Update password in case it changed
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: user.password,
        email_confirm: true,
      });

      if (updateError) {
        console.error(`   ❌ Fehler beim Aktualisieren: ${updateError.message}`);
        continue;
      }
      console.log(`   ✅ Passwort aktualisiert`);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Skip email verification
        user_metadata: {
          display_name: user.displayName,
        },
      });

      if (createError) {
        console.error(`   ❌ Fehler beim Erstellen: ${createError.message}`);
        continue;
      }

      userId = newUser.user.id;
      console.log(`   ✅ User erstellt (ID: ${userId})`);
    }

    // Update or create profile with correct role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          role: user.role,
          display_name: user.displayName,
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error(`   ❌ Fehler beim Profil: ${profileError.message}`);
    } else {
      console.log(`   ✅ Profil konfiguriert (Rolle: ${user.role})`);
    }

    // Link driver user to driver record if specified
    if ('linkToDriver' in user && user.linkToDriver) {
      const { error: linkError } = await supabase
        .from('drivers')
        .update({ user_id: userId })
        .eq('driver_code', user.linkToDriver);

      if (linkError) {
        console.error(`   ❌ Fehler beim Verknüpfen mit Fahrer: ${linkError.message}`);
      } else {
        console.log(`   ✅ Mit Fahrer-Record verknüpft (${user.linkToDriver})`);
      }
    }

    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Demo-User Setup abgeschlossen!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Anmeldedaten:');
  console.log('');
  console.log('  Dispatcher (Admin):');
  console.log('    Email:    dispatcher@demo.fahrdienst.ch');
  console.log('    Passwort: Demo1234!');
  console.log('');
  console.log('  Fahrer:');
  console.log('    Email:    fahrer@demo.fahrdienst.ch');
  console.log('    Passwort: Demo1234!');
  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
