'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  Driver,
  DriverRow,
  CreateDriverInput,
  UpdateDriverInput,
  driverRowToEntity,
  driverInputToRow,
} from '@/types/database';
import { sanitizeSearchQuery, validateId } from '@/lib/utils/sanitize';

// =============================================================================
// READ OPERATIONS
// =============================================================================

export async function getDrivers(includeInactive = false): Promise<Driver[]> {
  const supabase = await createClient();

  let query = supabase
    .from('drivers')
    .select('*')
    .order('last_name')
    .order('first_name');

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch drivers: ${error.message}`);

  return (data as DriverRow[]).map(driverRowToEntity);
}

export async function getDriverById(id: string): Promise<Driver | null> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'driver');

  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', validId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch driver: ${error.message}`);
  }

  return driverRowToEntity(data as DriverRow);
}

export async function getDriverByUserId(userId: string): Promise<Driver | null> {
  const supabase = await createClient();

  // Validate user ID format to prevent injection
  const validUserId = validateId(userId, 'user');

  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('user_id', validUserId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch driver: ${error.message}`);
  }

  return driverRowToEntity(data as DriverRow);
}

export async function searchDrivers(query: string): Promise<Driver[]> {
  const supabase = await createClient();

  // Sanitize input to prevent SQL injection
  const sanitized = sanitizeSearchQuery(query);

  if (!sanitized) {
    return [];
  }

  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('is_active', true)
    .or(`first_name.ilike.%${sanitized}%,last_name.ilike.%${sanitized}%,driver_code.ilike.%${sanitized}%`)
    .order('last_name')
    .limit(20);

  if (error) throw new Error(`Failed to search drivers: ${error.message}`);

  return (data as DriverRow[]).map(driverRowToEntity);
}

// =============================================================================
// CREATE OPERATIONS
// =============================================================================

export async function createDriver(input: CreateDriverInput): Promise<Driver> {
  const supabase = await createClient();

  const row = driverInputToRow(input);

  const { data, error } = await supabase
    .from('drivers')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create driver: ${error.message}`);

  revalidatePath('/drivers');
  return driverRowToEntity(data as DriverRow);
}

// =============================================================================
// UPDATE OPERATIONS
// =============================================================================

export async function updateDriver(id: string, input: UpdateDriverInput): Promise<Driver> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'driver');

  const row: Partial<DriverRow> = {};

  if (input.userId !== undefined) row.user_id = input.userId;
  if (input.driverCode !== undefined) row.driver_code = input.driverCode;
  if (input.firstName !== undefined) row.first_name = input.firstName;
  if (input.lastName !== undefined) row.last_name = input.lastName;
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.email !== undefined) row.email = input.email;
  if (input.homeCity !== undefined) row.home_city = input.homeCity;
  if (input.homeStreet !== undefined) row.home_street = input.homeStreet;
  if (input.homePostalCode !== undefined) row.home_postal_code = input.homePostalCode;
  if (input.hasDrivingLicense !== undefined) row.has_driving_license = input.hasDrivingLicense;
  if (input.vehicleType !== undefined) row.vehicle_type = input.vehicleType;
  if (input.vehiclePlate !== undefined) row.vehicle_plate = input.vehiclePlate;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.isActive !== undefined) row.is_active = input.isActive;

  const { data, error } = await supabase
    .from('drivers')
    .update(row)
    .eq('id', validId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update driver: ${error.message}`);

  revalidatePath('/drivers');
  revalidatePath(`/drivers/${validId}`);
  return driverRowToEntity(data as DriverRow);
}

// =============================================================================
// DEACTIVATE (Soft Delete)
// =============================================================================

export async function deactivateDriver(id: string): Promise<void> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'driver');

  const { error } = await supabase
    .from('drivers')
    .update({ is_active: false })
    .eq('id', validId);

  if (error) throw new Error(`Failed to deactivate driver: ${error.message}`);

  revalidatePath('/drivers');
}

export async function reactivateDriver(id: string): Promise<void> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'driver');

  const { error } = await supabase
    .from('drivers')
    .update({ is_active: true })
    .eq('id', validId);

  if (error) throw new Error(`Failed to reactivate driver: ${error.message}`);

  revalidatePath('/drivers');
}
