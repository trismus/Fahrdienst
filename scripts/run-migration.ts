/**
 * Run Schema Migration
 * Adds missing columns needed for the extended schema
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Supabase credentials missing');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('🔧 Running schema migration...\n');

  // =========================================================================
  // MIGRATE PATIENTS
  // =========================================================================
  console.log('📋 Migrating patients...');

  const { data: patients } = await supabase.from('patients').select('id, name, address, special_needs');

  if (patients) {
    let migrated = 0;
    for (const patient of patients) {
      const updates: Record<string, unknown> = {};

      // Migrate name -> first_name + last_name
      if (patient.name) {
        const parts = patient.name.split(' ');
        updates.first_name = parts[0] || '';
        updates.last_name = parts.slice(1).join(' ') || '';
      }

      // Migrate address -> street + postal_code + city
      if (patient.address) {
        const parts = patient.address.split(',');
        updates.street = parts[0]?.trim() || '';
        const cityPart = parts[1]?.trim() || '';
        const postalMatch = cityPart.match(/^(\d{4})\s+(.+)$/);
        if (postalMatch) {
          updates.postal_code = postalMatch[1];
          updates.city = postalMatch[2];
        } else {
          updates.postal_code = '';
          updates.city = cityPart;
        }
      }

      // Migrate special_needs -> boolean flags
      if (patient.special_needs) {
        const needs = patient.special_needs.toLowerCase();
        updates.needs_wheelchair = needs.includes('rollstuhl');
        updates.needs_walker = needs.includes('rollator');
        updates.needs_assistance = needs.includes('begleitung');
      } else {
        updates.needs_wheelchair = false;
        updates.needs_walker = false;
        updates.needs_assistance = false;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('patients').update(updates).eq('id', patient.id);
        if (error) {
          console.log(`   ⚠️  ${patient.name}: ${error.message}`);
        } else {
          migrated++;
        }
      }
    }
    console.log(`   ✅ ${migrated} patients migrated\n`);
  }

  // =========================================================================
  // MIGRATE DRIVERS
  // =========================================================================
  console.log('🚗 Migrating drivers...');

  const { data: drivers } = await supabase.from('drivers').select('id, name');

  if (drivers) {
    let migrated = 0;
    for (const driver of drivers) {
      if (driver.name) {
        const parts = driver.name.split(' ');
        const { error } = await supabase.from('drivers').update({
          first_name: parts[0] || '',
          last_name: parts.slice(1).join(' ') || ''
        }).eq('id', driver.id);

        if (error) {
          console.log(`   ⚠️  ${driver.name}: ${error.message}`);
        } else {
          migrated++;
        }
      }
    }
    console.log(`   ✅ ${migrated} drivers migrated\n`);
  }

  // =========================================================================
  // MIGRATE DESTINATIONS
  // =========================================================================
  console.log('🏥 Migrating destinations...');

  const { data: destinations } = await supabase.from('destinations').select('id, name, address');

  if (destinations) {
    let migrated = 0;
    for (const dest of destinations) {
      if (dest.address) {
        const parts = dest.address.split(',');
        const street = parts[0]?.trim() || '';
        const cityPart = parts[1]?.trim() || '';
        const postalMatch = cityPart.match(/^(\d{4})\s+(.+)$/);

        const updates: Record<string, string> = { street };
        if (postalMatch) {
          updates.postal_code = postalMatch[1];
          updates.city = postalMatch[2];
        } else {
          updates.postal_code = '';
          updates.city = cityPart;
        }

        const { error } = await supabase.from('destinations').update(updates).eq('id', dest.id);
        if (error) {
          console.log(`   ⚠️  ${dest.name}: ${error.message}`);
        } else {
          migrated++;
        }
      }
    }
    console.log(`   ✅ ${migrated} destinations migrated\n`);
  }

  // =========================================================================
  // VERIFY
  // =========================================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const { data: checkPatient } = await supabase.from('patients').select('first_name, last_name, street, city').limit(1);
  const { data: checkDriver } = await supabase.from('drivers').select('first_name, last_name').limit(1);

  if (checkPatient?.[0]?.first_name) {
    console.log('✅ Migration erfolgreich!');
    console.log(`   Beispiel Patient: ${checkPatient[0].first_name} ${checkPatient[0].last_name}, ${checkPatient[0].street}, ${checkPatient[0].city}`);
  } else {
    console.log('⚠️  Migration möglicherweise nicht vollständig');
    console.log('   Bitte führe das SQL manuell aus: supabase/migrate-to-extended-schema.sql');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error);
