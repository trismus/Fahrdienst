import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔍 Checking profiles table...\n');

  // Get all profiles (using service role bypasses RLS)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.log(`❌ Error reading profiles: ${error.message}`);
    return;
  }

  console.log(`Found ${profiles?.length || 0} profiles:\n`);

  profiles?.forEach(p => {
    console.log(`  ID: ${p.id}`);
    console.log(`  Role: ${p.role}`);
    console.log(`  Display Name: ${p.display_name}`);
    console.log('  ---');
  });

  // Check if dispatcher profile exists
  const { data: users } = await supabase.auth.admin.listUsers();
  const dispatcher = users?.users?.find(u => u.email === 'dispatcher@demo.fahrdienst.ch');

  if (dispatcher) {
    console.log(`\n📧 Dispatcher User ID: ${dispatcher.id}`);

    const dispatcherProfile = profiles?.find(p => p.id === dispatcher.id);
    if (dispatcherProfile) {
      console.log(`✅ Dispatcher profile exists with role: ${dispatcherProfile.role}`);
    } else {
      console.log('❌ Dispatcher profile MISSING!');
      console.log('   Creating profile...');

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: dispatcher.id,
          role: 'admin',
          display_name: 'Demo Dispatcher'
        });

      if (insertError) {
        console.log(`   ❌ Failed: ${insertError.message}`);
      } else {
        console.log('   ✅ Profile created!');
      }
    }
  }
}

main().catch(console.error);
