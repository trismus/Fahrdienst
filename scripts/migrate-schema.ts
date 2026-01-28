/**
 * Schema Migration Script
 *
 * Adds missing columns to support the extended schema.
 * Run: npx tsx scripts/migrate-schema.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Supabase credentials missing in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('🔧 Running schema migration...\n');

  // Add missing columns to patients
  console.log('📋 Migrating patients table...');

  const patientMigrations = [
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_name TEXT",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_name TEXT",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS street TEXT",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS postal_code TEXT",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS needs_wheelchair BOOLEAN DEFAULT FALSE",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS needs_walker BOOLEAN DEFAULT FALSE",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS needs_assistance BOOLEAN DEFAULT FALSE",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS pickup_instructions TEXT",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
  ];

  for (const sql of patientMigrations) {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error && !error.message.includes('already exists')) {
      console.log(`   ⚠️  ${sql.substring(0, 50)}... - ${error.message}`);
    }
  }

  // Migrate data from old columns to new columns
  console.log('   Migrating data from name -> first_name/last_name...');
  const { error: migrateNamesError } = await supabase.rpc('exec_sql', {
    sql: `
      UPDATE patients
      SET
        first_name = COALESCE(first_name, SPLIT_PART(name, ' ', 1)),
        last_name = COALESCE(last_name, NULLIF(SUBSTRING(name FROM POSITION(' ' IN name) + 1), ''))
      WHERE name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);
    `
  });
  if (migrateNamesError) {
    // Try direct approach
    await supabase.from('patients').select('id, name').then(async ({ data }) => {
      if (data) {
        for (const patient of data) {
          if (patient.name) {
            const parts = patient.name.split(' ');
            const firstName = parts[0] || '';
            const lastName = parts.slice(1).join(' ') || '';
            await supabase.from('patients').update({
              first_name: firstName,
              last_name: lastName
            }).eq('id', patient.id);
          }
        }
      }
    });
  }

  console.log('   Migrating data from address -> street/city...');
  const { data: patients } = await supabase.from('patients').select('id, address');
  if (patients) {
    for (const patient of patients) {
      if (patient.address) {
        // Parse "Street, PostalCode City" format
        const parts = patient.address.split(',');
        const street = parts[0]?.trim() || '';
        const cityPart = parts[1]?.trim() || '';
        const postalMatch = cityPart.match(/^(\d{4})\s+(.+)$/);
        const postalCode = postalMatch?.[1] || '';
        const city = postalMatch?.[2] || cityPart;

        await supabase.from('patients').update({
          street,
          postal_code: postalCode,
          city
        }).eq('id', patient.id);
      }
    }
  }

  console.log('   Migrating special_needs -> flags...');
  const { data: patientsNeeds } = await supabase.from('patients').select('id, special_needs');
  if (patientsNeeds) {
    for (const patient of patientsNeeds) {
      if (patient.special_needs) {
        const needs = patient.special_needs.toLowerCase();
        await supabase.from('patients').update({
          needs_wheelchair: needs.includes('rollstuhl'),
          needs_walker: needs.includes('rollator'),
          needs_assistance: needs.includes('begleitung')
        }).eq('id', patient.id);
      }
    }
  }

  console.log('   ✅ Patients migrated\n');

  // Add missing columns to drivers
  console.log('🚗 Migrating drivers table...');

  const { data: drivers } = await supabase.from('drivers').select('id, name');
  if (drivers) {
    for (const driver of drivers) {
      if (driver.name) {
        const parts = driver.name.split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        await supabase.from('drivers').update({
          first_name: firstName,
          last_name: lastName
        }).eq('id', driver.id);
      }
    }
  }

  console.log('   ✅ Drivers migrated\n');

  // Add missing columns to destinations
  console.log('🏥 Migrating destinations table...');

  const { data: destinations } = await supabase.from('destinations').select('id, address');
  if (destinations) {
    for (const dest of destinations) {
      if (dest.address) {
        const parts = dest.address.split(',');
        const street = parts[0]?.trim() || '';
        const cityPart = parts[1]?.trim() || '';
        const postalMatch = cityPart.match(/^(\d{4})\s+(.+)$/);
        const postalCode = postalMatch?.[1] || '';
        const city = postalMatch?.[2] || cityPart;

        await supabase.from('destinations').update({
          street,
          postal_code: postalCode,
          city
        }).eq('id', dest.id);
      }
    }
  }

  console.log('   ✅ Destinations migrated\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Schema migration complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error);
