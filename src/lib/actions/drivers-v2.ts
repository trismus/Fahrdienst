'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  Driver,
  DriverRow,
  driverRowToEntity,
  driverInputToRow,
} from '@/types/database';
import { sanitizeSearchQuery, validateId } from '@/lib/utils/sanitize';
import {
  createDriverSchema,
  updateDriverSchema,
  validate,
  type CreateDriverInput,
  type UpdateDriverInput,
} from '@/lib/validations/schemas';
import { checkRateLimit, createRateLimitKey, RATE_LIMITS, RateLimitError } from '@/lib/utils/rate-limit';

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

  // Rate limiting: get user ID for rate limit key
  const { data: { user } } = await supabase.auth.getUser();
  const rateLimitKey = createRateLimitKey(user?.id || null, 'search:drivers');
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.search);

  if (!rateLimitResult.success) {
    throw new RateLimitError(rateLimitResult.resetTime);
  }

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

  // Validate input to prevent XSS and ensure data integrity
  const validatedInput = validate(createDriverSchema, input);
  const row = driverInputToRow(validatedInput);

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

  // Validate input to prevent XSS and ensure data integrity
  const validatedInput = validate(updateDriverSchema, input);

  const row: Partial<DriverRow> = {};

  if (validatedInput.userId !== undefined) row.user_id = validatedInput.userId;
  if (validatedInput.driverCode !== undefined) row.driver_code = validatedInput.driverCode;
  if (validatedInput.firstName !== undefined) row.first_name = validatedInput.firstName;
  if (validatedInput.lastName !== undefined) row.last_name = validatedInput.lastName;
  if (validatedInput.phone !== undefined) row.phone = validatedInput.phone;
  if (validatedInput.email !== undefined) row.email = validatedInput.email;
  if (validatedInput.homeCity !== undefined) row.home_city = validatedInput.homeCity;
  if (validatedInput.homeStreet !== undefined) row.home_street = validatedInput.homeStreet;
  if (validatedInput.homePostalCode !== undefined) row.home_postal_code = validatedInput.homePostalCode;
  if (validatedInput.hasDrivingLicense !== undefined) row.has_driving_license = validatedInput.hasDrivingLicense;
  if (validatedInput.vehicleType !== undefined) row.vehicle_type = validatedInput.vehicleType;
  if (validatedInput.vehiclePlate !== undefined) row.vehicle_plate = validatedInput.vehiclePlate;
  if (validatedInput.notes !== undefined) row.notes = validatedInput.notes;
  if (validatedInput.isActive !== undefined) row.is_active = validatedInput.isActive;

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
