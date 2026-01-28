/**
 * Production Demo Data Seeding Script
 *
 * Inserts realistic Swiss demo data into the database.
 * Run: npx tsx scripts/seed-production-demo.ts
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

  console.log('🚀 Seeding production demo data...\n');

  // =========================================================================
  // PATIENTS
  // =========================================================================
  console.log('📋 Inserting patients...');

  const patients = [
    {
      name: 'Elisabeth Brunner',
      address: 'Bahnhofstrasse 42, 5400 Baden',
      latitude: 47.4731,
      longitude: 8.3069,
      phone: '+41 56 221 34 56',
      special_needs: 'Rollstuhl, Begleitung nötig',
      notes: 'Dialyse Mo/Mi/Fr. Klingeln bei Brunner, 2. Stock rechts. Lift vorhanden. Notfall: Hans Brunner +41 79 334 55 66'
    },
    {
      name: 'Werner Müller',
      address: 'Hauptstrasse 15, 5000 Aarau',
      latitude: 47.3925,
      longitude: 8.0444,
      phone: '+41 62 823 45 67',
      special_needs: 'Rollator',
      notes: 'Regelmässige Physiotherapie. Erdgeschoss, direkt an der Strasse. Notfall: Margrit Müller +41 62 823 45 68'
    },
    {
      name: 'Ruth Schneider',
      address: 'Lindenweg 8, 5430 Wettingen',
      latitude: 47.4625,
      longitude: 8.3228,
      phone: '+41 56 426 78 90',
      special_needs: null,
      notes: 'Augenarzt-Kontrollen alle 3 Monate. Notfall: Peter Schneider +41 79 456 78 90'
    },
    {
      name: 'Kurt Weber',
      address: 'Römerstrasse 25, 5200 Brugg',
      latitude: 47.4858,
      longitude: 8.2082,
      phone: '+41 56 222 11 33',
      special_needs: 'Rollstuhl, Begleitung nötig',
      notes: 'Chemotherapie-Termine. Oft müde nach Behandlung. Hintereingang benutzen, Rampe vorhanden. Notfall: Silvia Weber +41 79 222 11 34'
    },
    {
      name: 'Maria Huber',
      address: 'Kirchplatz 3, 5600 Lenzburg',
      latitude: 47.3884,
      longitude: 8.1750,
      phone: '+41 62 891 23 45',
      special_needs: 'Begleitung nötig',
      notes: 'Kardiologie-Kontrollen. Wohnung im 1. Stock, kein Lift. Braucht Zeit für Treppen. Notfall: Thomas Huber +41 79 891 23 46'
    },
    {
      name: 'Fritz Steiner',
      address: 'Industriestrasse 10, 5432 Neuenhof',
      latitude: 47.4517,
      longitude: 8.3194,
      phone: '+41 56 441 55 66',
      special_needs: 'Rollator',
      notes: 'Dialyse Di/Do/Sa morgens. Bitte hupen, Patient kommt selbst raus. Notfall: Anna Steiner +41 79 441 55 67'
    },
    {
      name: 'Heidi Keller',
      address: 'Altersheim Sonnenberg, Zimmer 204, 5413 Birmenstorf',
      latitude: 47.4622,
      longitude: 8.2525,
      phone: '+41 56 203 44 55',
      special_needs: 'Rollstuhl, Begleitung nötig',
      notes: 'Bewohnerin Altersheim. Abholung an der Rezeption. Personal informiert. Notfall: Altersheim +41 56 203 44 00'
    },
    {
      name: 'Hans-Peter Zimmermann',
      address: 'Dorfstrasse 55, 5034 Suhr',
      latitude: 47.3722,
      longitude: 8.0789,
      phone: '+41 62 844 77 88',
      special_needs: null,
      notes: 'Hausarzt-Termine und gelegentlich Spital. Notfall: Beatrice Zimmermann +41 79 844 77 89'
    }
  ];

  for (const patient of patients) {
    const { error } = await supabase.from('patients').insert(patient);
    if (error) {
      console.log(`   ❌ ${patient.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${patient.name}`);
    }
  }

  // =========================================================================
  // DRIVERS
  // =========================================================================
  console.log('\n🚗 Inserting drivers...');

  const drivers = [
    { name: 'Marco Bernasconi', phone: '+41 79 300 10 01', email: 'm.bernasconi@example.com' },
    { name: 'Sandra Frei', phone: '+41 79 300 10 02', email: 's.frei@example.com' },
    { name: 'Thomas Gerber', phone: '+41 79 300 10 03', email: 't.gerber@example.com' },
    { name: 'Nicole Bühler', phone: '+41 79 300 10 04', email: 'n.buehler@example.com' }
  ];

  for (const driver of drivers) {
    const { error } = await supabase.from('drivers').insert(driver);
    if (error) {
      console.log(`   ❌ ${driver.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${driver.name}`);
    }
  }

  // =========================================================================
  // DESTINATIONS
  // =========================================================================
  console.log('\n🏥 Inserting destinations...');

  const destinations = [
    {
      name: 'Kantonsspital Baden',
      address: 'Im Ergel 1, 5404 Baden',
      latitude: 47.4689,
      longitude: 8.3047,
      arrival_window_start: '06:00',
      arrival_window_end: '22:00'
    },
    {
      name: 'Kantonsspital Baden - Dialyse',
      address: 'Im Ergel 1, 5404 Baden (Eingang Ost, Ebene 2)',
      latitude: 47.4689,
      longitude: 8.3047,
      arrival_window_start: '06:00',
      arrival_window_end: '22:00'
    },
    {
      name: 'Kantonsspital Baden - Onkologie',
      address: 'Im Ergel 1, 5404 Baden (Eingang Süd, Ebene 1)',
      latitude: 47.4689,
      longitude: 8.3047,
      arrival_window_start: '07:30',
      arrival_window_end: '17:00'
    },
    {
      name: 'Kantonsspital Aarau',
      address: 'Tellstrasse 25, 5001 Aarau',
      latitude: 47.3892,
      longitude: 8.0503,
      arrival_window_start: '06:00',
      arrival_window_end: '22:00'
    },
    {
      name: 'Augenzentrum Aarau',
      address: 'Bahnhofstrasse 12, 5000 Aarau',
      latitude: 47.3912,
      longitude: 8.0511,
      arrival_window_start: '08:00',
      arrival_window_end: '17:00'
    },
    {
      name: 'Physiotherapie am Bahnhof',
      address: 'Bahnhofplatz 7, 5400 Baden',
      latitude: 47.4763,
      longitude: 8.3064,
      arrival_window_start: '07:00',
      arrival_window_end: '20:00'
    },
    {
      name: 'Praxis Dr. med. A. Fischer',
      address: 'Landstrasse 100, 5430 Wettingen',
      latitude: 47.4608,
      longitude: 8.3156,
      arrival_window_start: '08:00',
      arrival_window_end: '18:00'
    },
    {
      name: 'Kardiologie Aarau',
      address: 'Laurenzenvorstadt 90, 5000 Aarau',
      latitude: 47.3928,
      longitude: 8.0467,
      arrival_window_start: '08:00',
      arrival_window_end: '17:00'
    }
  ];

  for (const dest of destinations) {
    const { error } = await supabase.from('destinations').insert(dest);
    if (error) {
      console.log(`   ❌ ${dest.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${dest.name}`);
    }
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
  const { count: driverCount } = await supabase.from('drivers').select('*', { count: 'exact', head: true });
  const { count: destCount } = await supabase.from('destinations').select('*', { count: 'exact', head: true });

  console.log(`✅ Demo-Daten erfolgreich eingefügt!`);
  console.log(`   Patienten:    ${patientCount}`);
  console.log(`   Fahrer:       ${driverCount}`);
  console.log(`   Ziele:        ${destCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error);
