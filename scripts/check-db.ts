import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Prüfe Datenbank-Tabellen...\n');

  // Check profiles
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  console.log('profiles:', profilesErr ? `❌ ${profilesErr.message}` : '✅ existiert');

  // Check patients
  const { data: patients, error: patientsErr } = await supabase
    .from('patients')
    .select('*')
    .limit(1);
  console.log('patients:', patientsErr ? `❌ ${patientsErr.message}` : `✅ existiert (${patients?.length || 0} rows)`);

  // Check drivers
  const { data: drivers, error: driversErr } = await supabase
    .from('drivers')
    .select('*')
    .limit(1);
  console.log('drivers:', driversErr ? `❌ ${driversErr.message}` : `✅ existiert (${drivers?.length || 0} rows)`);

  // Check destinations
  const { data: destinations, error: destinationsErr } = await supabase
    .from('destinations')
    .select('*')
    .limit(1);
  console.log('destinations:', destinationsErr ? `❌ ${destinationsErr.message}` : `✅ existiert (${destinations?.length || 0} rows)`);

  // Check rides
  const { data: rides, error: ridesErr } = await supabase
    .from('rides')
    .select('*')
    .limit(1);
  console.log('rides:', ridesErr ? `❌ ${ridesErr.message}` : '✅ existiert');
}

main();
