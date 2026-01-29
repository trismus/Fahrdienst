'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from './auth';
import type { Driver, DriverWithAvailability, AvailabilityBlock, Absence } from '@/types';

// =============================================================================
// AUTHORIZATION HELPERS
// =============================================================================

/**
 * Validates that the current user has permission to manage a driver's data.
 * - Admins/Operators can manage any driver
 * - Drivers can only manage their own data
 *
 * @throws Error if user is not authorized
 */
async function validateDriverManagementPermission(driverId: string): Promise<void> {
  const profile = await getUserProfile();

  if (!profile) {
    throw new Error('Nicht authentifiziert');
  }

  // Admins and operators can manage any driver
  if (profile.role === 'admin' || profile.role === 'operator') {
    return;
  }

  // Drivers can only manage their own data
  if (profile.role === 'driver') {
    if (profile.driverId !== driverId) {
      throw new Error('Zugriff verweigert: Sie koennen nur Ihre eigenen Daten verwalten');
    }
    return;
  }

  throw new Error('Zugriff verweigert');
}

export async function getDrivers(): Promise<Driver[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getDriver(id: string): Promise<Driver | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data;
}

export async function getDriverWithAvailability(id: string): Promise<DriverWithAvailability | null> {
  const supabase = await createClient();

  const { data: driver, error: driverError } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', id)
    .single();

  if (driverError) {
    if (driverError.code === 'PGRST116') return null;
    throw new Error(driverError.message);
  }

  const { data: blocks, error: blocksError } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('driver_id', id)
    .order('weekday')
    .order('start_time');

  if (blocksError) throw new Error(blocksError.message);

  const { data: absences, error: absencesError } = await supabase
    .from('absences')
    .select('*')
    .eq('driver_id', id)
    .order('from_date');

  if (absencesError) throw new Error(absencesError.message);

  return {
    ...driver,
    availability_blocks: blocks || [],
    absences: absences || [],
  };
}

export interface CreateDriverData {
  name: string;
  phone: string;
  email: string;
}

export async function createDriver(data: CreateDriverData): Promise<Driver> {
  const supabase = await createClient();
  const { data: driver, error } = await supabase
    .from('drivers')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/drivers');
  return driver;
}

export async function updateDriver(id: string, data: Partial<CreateDriverData>): Promise<Driver> {
  const supabase = await createClient();
  const { data: driver, error } = await supabase
    .from('drivers')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/drivers');
  revalidatePath(`/drivers/${id}`);
  return driver;
}

export async function deleteDriver(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('drivers')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/drivers');
}

// Availability Blocks
export interface CreateAvailabilityBlockData {
  driver_id: string;
  weekday: string;
  start_time: string;
  end_time: string;
}

export async function setAvailabilityBlock(data: CreateAvailabilityBlockData): Promise<AvailabilityBlock> {
  const supabase = await createClient();
  const { data: block, error } = await supabase
    .from('availability_blocks')
    .upsert(data, { onConflict: 'driver_id,weekday,start_time' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/drivers/${data.driver_id}`);
  revalidatePath('/availability');
  return block;
}

export async function deleteAvailabilityBlock(id: string, driverId: string): Promise<void> {
  // Validate authorization before proceeding
  await validateDriverManagementPermission(driverId);

  const supabase = await createClient();
  const { error } = await supabase
    .from('availability_blocks')
    .delete()
    .eq('id', id)
    .eq('driver_id', driverId); // Extra safety: ensure block belongs to this driver

  if (error) throw new Error(error.message);
  revalidatePath(`/drivers/${driverId}`);
  revalidatePath('/availability');
}

// Absences
export interface CreateAbsenceData {
  driver_id: string;
  from_date: string;
  to_date: string;
  reason?: string;
}

export async function createAbsence(data: CreateAbsenceData): Promise<Absence> {
  // Validate authorization before proceeding
  await validateDriverManagementPermission(data.driver_id);

  const supabase = await createClient();
  const { data: absence, error } = await supabase
    .from('absences')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/drivers/${data.driver_id}`);
  revalidatePath('/availability');
  return absence;
}

export async function deleteAbsence(id: string, driverId: string): Promise<void> {
  // Validate authorization before proceeding
  await validateDriverManagementPermission(driverId);

  const supabase = await createClient();
  const { error } = await supabase
    .from('absences')
    .delete()
    .eq('id', id)
    .eq('driver_id', driverId); // Extra safety: ensure absence belongs to this driver

  if (error) throw new Error(error.message);
  revalidatePath(`/drivers/${driverId}`);
  revalidatePath('/availability');
}
