/**
 * Script to check if demo users exist in the database
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

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

async function checkDemoUsers() {
  console.log('\n🔍 Checking demo users...\n')

  // Check if DEMO_USER_PASSWORD is set
  const demoPassword = process.env.DEMO_USER_PASSWORD
  if (!demoPassword) {
    console.log('⚠️  DEMO_USER_PASSWORD is not set in .env.local')
  } else {
    console.log('✅ DEMO_USER_PASSWORD is set')
  }

  // Get all users from auth
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error fetching auth users:', authError.message)
    return
  }

  const dispatcherEmail = 'dispatcher@demo.fahrdienst.ch'
  const driverEmail = 'fahrer@demo.fahrdienst.ch'

  const dispatcherAuthUser = authUsers.users.find(u => u.email === dispatcherEmail)
  const driverAuthUser = authUsers.users.find(u => u.email === driverEmail)

  console.log('\n📧 Auth Users:')
  console.log(`Dispatcher (${dispatcherEmail}):`, dispatcherAuthUser ? `✅ Exists (ID: ${dispatcherAuthUser.id})` : '❌ Not found')
  console.log(`Driver (${driverEmail}):`, driverAuthUser ? `✅ Exists (ID: ${driverAuthUser.id})` : '❌ Not found')

  if (!dispatcherAuthUser || !driverAuthUser) {
    console.log('\n⚠️  Demo users need to be created in Supabase Dashboard first!')
    console.log('See: docs/demo-setup.md for instructions')
    return
  }

  // Check profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', [dispatcherAuthUser.id, driverAuthUser.id])

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message)
    return
  }

  console.log('\n👤 Profiles:')
  const dispatcherProfile = profiles?.find(p => p.id === dispatcherAuthUser.id)
  const driverProfile = profiles?.find(p => p.id === driverAuthUser.id)

  if (dispatcherProfile) {
    console.log(`Dispatcher: ✅ Exists`)
    console.log(`  - Role: ${dispatcherProfile.role} ${dispatcherProfile.role === 'admin' ? '✅' : '❌ Should be "admin"'}`)
    console.log(`  - Display Name: ${dispatcherProfile.display_name}`)
  } else {
    console.log('Dispatcher: ❌ Profile not found')
  }

  if (driverProfile) {
    console.log(`Driver: ✅ Exists`)
    console.log(`  - Role: ${driverProfile.role} ${driverProfile.role === 'driver' ? '✅' : '❌ Should be "driver"'}`)
    console.log(`  - Display Name: ${driverProfile.display_name}`)
  } else {
    console.log('Driver: ❌ Profile not found')
  }

  // Check driver record linkage
  if (driverAuthUser) {
    const { data: driverRecord, error: driverError } = await supabase
      .from('drivers')
      .select('id, driver_code, first_name, last_name, user_id')
      .eq('user_id', driverAuthUser.id)
      .single()

    console.log('\n🚗 Driver Record:')
    if (driverRecord) {
      console.log(`✅ Driver record linked: ${driverRecord.driver_code} (${driverRecord.first_name} ${driverRecord.last_name})`)
    } else {
      console.log('❌ No driver record linked to this user')

      // Check if TEST-DRV-01 exists
      const { data: testDriver } = await supabase
        .from('drivers')
        .select('id, driver_code, first_name, user_id')
        .eq('driver_code', 'TEST-DRV-01')
        .single()

      if (testDriver) {
        console.log(`   Found TEST-DRV-01, current user_id: ${testDriver.user_id || 'NULL'}`)
      }
    }
  }

  console.log('\n' + '='.repeat(60))

  const allGood = dispatcherAuthUser && driverAuthUser &&
                  dispatcherProfile?.role === 'admin' &&
                  driverProfile?.role === 'driver'

  if (allGood) {
    console.log('✅ Demo users are properly configured!')
  } else {
    console.log('⚠️  Demo users need configuration')
    console.log('Run: supabase/demo-users-setup.sql in Supabase SQL Editor')
  }
  console.log('='.repeat(60) + '\n')
}

checkDemoUsers().catch(console.error)
