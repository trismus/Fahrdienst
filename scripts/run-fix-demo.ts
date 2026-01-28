/**
 * Script to run the demo setup fix via Supabase client
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixDemoSetup() {
  console.log('\n🔧 Fixing demo setup...\n')

  const driverUserId = '20905f39-8062-411e-9b13-6560f5e7d19b'

  // Check if TEST-DRV-01 exists
  const { data: existingDriver, error: findError } = await supabase
    .from('drivers')
    .select('id, driver_code, first_name, last_name, user_id')
    .eq('driver_code', 'TEST-DRV-01')
    .single()

  if (existingDriver) {
    console.log(`Found existing driver: ${existingDriver.driver_code}`)
    console.log(`  Name: ${existingDriver.first_name} ${existingDriver.last_name}`)
    console.log(`  Current user_id: ${existingDriver.user_id || 'NULL'}`)

    // Link to demo user
    const { error: updateError } = await supabase
      .from('drivers')
      .update({ user_id: driverUserId })
      .eq('id', existingDriver.id)

    if (updateError) {
      console.error('❌ Error linking driver:', updateError.message)
    } else {
      console.log(`✅ Linked TEST-DRV-01 to demo user ${driverUserId}`)
    }
  } else {
    console.log('Creating new driver TEST-DRV-01...')

    const { data: newDriver, error: createError } = await supabase
      .from('drivers')
      .insert({
        driver_code: 'TEST-DRV-01',
        first_name: 'Max',
        last_name: 'Mustermann',
        phone: '+41791234567',
        email: 'fahrer@demo.fahrdienst.ch',
        user_id: driverUserId,
        is_active: true,
        vehicle_type: 'car'
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating driver:', createError.message)
    } else {
      console.log(`✅ Created driver TEST-DRV-01 and linked to demo user`)
    }
  }

  // Verify
  const { data: verifyDriver } = await supabase
    .from('drivers')
    .select(`
      driver_code,
      first_name,
      last_name,
      user_id
    `)
    .eq('driver_code', 'TEST-DRV-01')
    .single()

  console.log('\n' + '='.repeat(60))
  if (verifyDriver?.user_id === driverUserId) {
    console.log('✅ Demo driver successfully linked!')
    console.log(`   Driver: ${verifyDriver.first_name} ${verifyDriver.last_name} (${verifyDriver.driver_code})`)
    console.log(`   User ID: ${verifyDriver.user_id}`)
  } else {
    console.log('⚠️  Verification failed - driver not properly linked')
  }
  console.log('='.repeat(60) + '\n')
}

fixDemoSetup().catch(console.error)
