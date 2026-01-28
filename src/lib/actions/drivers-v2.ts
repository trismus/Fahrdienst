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
  type CreateDriverInput as ZodCreateDriverInput,
  type UpdateDriverInput as ZodUpdateDriverInput,
} from '@/lib/validations/schemas';
import { checkRateLimit, createRateLimitKey, RATE_LIMITS, RateLimitError } from '@/lib/utils/rate-limit';
import type { CreateDriverInput } from '@/types/database';

// Helper to convert null to undefined for optional fields
function nullToUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = { ...obj };
  for (const key of Object.keys(result)) {
    if (result[key] === null) {
      result[key] = undefined;
    }
  }
  return result;
}

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

export async function createDriver(input: ZodCreateDriverInput): Promise<Driver> {
  const supabase = await createClient();

  // Validate input to prevent XSS and ensure data integrity
  const validatedInput = validate(createDriverSchema, input);
  // Convert null values to undefined for type compatibility
  const convertedInput = nullToUndefined(validatedInput) as unknown as CreateDriverInput;
  const row = driverInputToRow(convertedInput);

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

export async function updateDriver(id: string, input: ZodUpdateDriverInput): Promise<Driver> {
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

// =============================================================================
// AVAILABILITY TYPES
// =============================================================================

export type AvailabilityStatus = 'available' | 'busy' | 'unavailable';

export interface DriverWithAvailability extends Driver {
  availabilityStatus: AvailabilityStatus;
  availabilityDetails: {
    hasAvailabilityBlock: boolean;
    isAbsent: boolean;
    hasOverlappingRide: boolean;
    overlappingRideId?: string;
  };
}

// =============================================================================
// GET DRIVERS WITH AVAILABILITY STATUS
// =============================================================================

/**
 * Gets all active drivers with their availability status for a specific pickup time.
 *
 * Availability status:
 * - 'available' (green): Has availability block, no absence, no overlapping rides
 * - 'busy' (yellow): Has availability but has another ride within 1 hour
 * - 'unavailable' (gray): No availability block or has absence
 *
 * @param pickupTime - ISO datetime string for the pickup time
 * @returns Array of drivers with availability information
 */
export async function getDriversWithAvailability(
  pickupTime: string
): Promise<DriverWithAvailability[]> {
  const supabase = await createClient();

  // Get all active drivers
  const { data: drivers, error: driversError } = await supabase
    .from('drivers')
    .select('*')
    .eq('is_active', true)
    .order('last_name')
    .order('first_name');

  if (driversError) throw new Error(`Fehler beim Laden der Fahrer: ${driversError.message}`);

  if (!drivers || drivers.length === 0) {
    return [];
  }

  const pickupDate = new Date(pickupTime);
  const pickupDateStr = pickupTime.split('T')[0]; // YYYY-MM-DD

  // Get weekday in German format (lowercase)
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekday = weekdays[pickupDate.getUTCDay()];

  // Only check for weekdays (Mon-Fri)
  const isWeekday = pickupDate.getUTCDay() >= 1 && pickupDate.getUTCDay() <= 5;

  // Get time in HH:MM format
  const pickupTimeStr = pickupDate.toISOString().substring(11, 16);

  const driverIds = drivers.map((d: DriverRow) => d.id);

  // Get availability blocks for all drivers for this weekday
  const { data: availabilityBlocks, error: blocksError } = await supabase
    .from('availability_blocks')
    .select('driver_id, start_time, end_time')
    .in('driver_id', driverIds)
    .eq('weekday', weekday);

  if (blocksError) {
    console.error('Error fetching availability blocks:', blocksError);
  }

  // Get absences for all drivers that overlap with pickup date
  const { data: absences, error: absencesError } = await supabase
    .from('absences')
    .select('driver_id, from_date, to_date')
    .in('driver_id', driverIds)
    .lte('from_date', pickupDateStr)
    .gte('to_date', pickupDateStr);

  if (absencesError) {
    console.error('Error fetching absences:', absencesError);
  }

  // Get rides for all drivers within 1 hour of pickup time
  const oneHourBefore = new Date(pickupDate.getTime() - 60 * 60 * 1000).toISOString();
  const oneHourAfter = new Date(pickupDate.getTime() + 60 * 60 * 1000).toISOString();

  const { data: overlappingRides, error: ridesError } = await supabase
    .from('rides')
    .select('id, driver_id, pickup_time')
    .in('driver_id', driverIds)
    .gte('pickup_time', oneHourBefore)
    .lte('pickup_time', oneHourAfter)
    .not('status', 'in', '("cancelled","completed")');

  if (ridesError) {
    console.error('Error fetching overlapping rides:', ridesError);
  }

  // Build availability map
  const availabilityMap = new Map<string, {
    hasAvailabilityBlock: boolean;
    isAbsent: boolean;
    hasOverlappingRide: boolean;
    overlappingRideId?: string;
  }>();

  // Initialize all drivers as having no availability
  for (const driver of drivers) {
    availabilityMap.set(driver.id, {
      hasAvailabilityBlock: false,
      isAbsent: false,
      hasOverlappingRide: false,
    });
  }

  // Check availability blocks
  if (availabilityBlocks && isWeekday) {
    for (const block of availabilityBlocks) {
      const driverAvail = availabilityMap.get(block.driver_id);
      if (driverAvail) {
        // Check if pickup time falls within this block
        const startTime = block.start_time.substring(0, 5); // HH:MM
        const endTime = block.end_time.substring(0, 5); // HH:MM

        if (pickupTimeStr >= startTime && pickupTimeStr < endTime) {
          driverAvail.hasAvailabilityBlock = true;
        }
      }
    }
  }

  // Check absences
  if (absences) {
    for (const absence of absences) {
      const driverAvail = availabilityMap.get(absence.driver_id);
      if (driverAvail) {
        driverAvail.isAbsent = true;
      }
    }
  }

  // Check overlapping rides
  if (overlappingRides) {
    for (const ride of overlappingRides) {
      if (!ride.driver_id) continue;
      const driverAvail = availabilityMap.get(ride.driver_id);
      if (driverAvail) {
        driverAvail.hasOverlappingRide = true;
        driverAvail.overlappingRideId = ride.id;
      }
    }
  }

  // Build result with availability status
  return (drivers as DriverRow[]).map((driver) => {
    const avail = availabilityMap.get(driver.id)!;

    let status: AvailabilityStatus;

    if (avail.isAbsent || !avail.hasAvailabilityBlock) {
      status = 'unavailable';
    } else if (avail.hasOverlappingRide) {
      status = 'busy';
    } else {
      status = 'available';
    }

    return {
      ...driverRowToEntity(driver),
      availabilityStatus: status,
      availabilityDetails: avail,
    };
  });
}

// =============================================================================
// GET DRIVER AVAILABILITY BLOCKS
// =============================================================================

export interface AvailabilityBlock {
  id: string;
  driverId: string;
  weekday: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export async function getDriverAvailabilityBlocks(driverId: string): Promise<AvailabilityBlock[]> {
  const supabase = await createClient();
  const validId = validateId(driverId, 'driver');

  const { data, error } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('driver_id', validId)
    .order('weekday')
    .order('start_time');

  if (error) throw new Error(`Fehler beim Laden der Verfügbarkeit: ${error.message}`);

  return (data || []).map((block: {
    id: string;
    driver_id: string;
    weekday: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
    start_time: string;
    end_time: string;
  }) => ({
    id: block.id,
    driverId: block.driver_id,
    weekday: block.weekday,
    startTime: block.start_time.substring(0, 5),
    endTime: block.end_time.substring(0, 5),
  }));
}

// =============================================================================
// GET DRIVER ABSENCES
// =============================================================================

export interface Absence {
  id: string;
  driverId: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  reason: string | null;
}

export async function getDriverAbsences(driverId: string): Promise<Absence[]> {
  const supabase = await createClient();
  const validId = validateId(driverId, 'driver');

  const { data, error } = await supabase
    .from('absences')
    .select('*')
    .eq('driver_id', validId)
    .order('from_date', { ascending: false });

  if (error) throw new Error(`Fehler beim Laden der Abwesenheiten: ${error.message}`);

  return (data || []).map((absence: {
    id: string;
    driver_id: string;
    from_date: string;
    to_date: string;
    reason: string | null;
  }) => ({
    id: absence.id,
    driverId: absence.driver_id,
    fromDate: absence.from_date,
    toDate: absence.to_date,
    reason: absence.reason,
  }));
}

// =============================================================================
// CREATE AVAILABILITY BLOCK
// =============================================================================

export async function createAvailabilityBlock(input: {
  driverId: string;
  weekday: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}): Promise<AvailabilityBlock> {
  const supabase = await createClient();
  const validDriverId = validateId(input.driverId, 'driver');

  const { data, error } = await supabase
    .from('availability_blocks')
    .insert({
      driver_id: validDriverId,
      weekday: input.weekday,
      start_time: input.startTime,
      end_time: input.endTime,
    })
    .select()
    .single();

  if (error) throw new Error(`Fehler beim Erstellen der Verfügbarkeit: ${error.message}`);

  revalidatePath(`/drivers/${validDriverId}`);

  return {
    id: data.id,
    driverId: data.driver_id,
    weekday: data.weekday,
    startTime: data.start_time.substring(0, 5),
    endTime: data.end_time.substring(0, 5),
  };
}

// =============================================================================
// DELETE AVAILABILITY BLOCK
// =============================================================================

export async function deleteAvailabilityBlock(id: string, driverId: string): Promise<void> {
  const supabase = await createClient();
  const validId = validateId(id, 'availability_block');
  const validDriverId = validateId(driverId, 'driver');

  const { error } = await supabase
    .from('availability_blocks')
    .delete()
    .eq('id', validId)
    .eq('driver_id', validDriverId);

  if (error) throw new Error(`Fehler beim Löschen der Verfügbarkeit: ${error.message}`);

  revalidatePath(`/drivers/${validDriverId}`);
}

// =============================================================================
// CREATE ABSENCE
// =============================================================================

export async function createAbsence(input: {
  driverId: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  reason?: string;
}): Promise<Absence> {
  const supabase = await createClient();
  const validDriverId = validateId(input.driverId, 'driver');

  // Validate dates
  if (new Date(input.toDate) < new Date(input.fromDate)) {
    throw new Error('Das Enddatum muss nach dem Startdatum liegen');
  }

  const { data, error } = await supabase
    .from('absences')
    .insert({
      driver_id: validDriverId,
      from_date: input.fromDate,
      to_date: input.toDate,
      reason: input.reason || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Fehler beim Erstellen der Abwesenheit: ${error.message}`);

  revalidatePath(`/drivers/${validDriverId}`);

  return {
    id: data.id,
    driverId: data.driver_id,
    fromDate: data.from_date,
    toDate: data.to_date,
    reason: data.reason,
  };
}

// =============================================================================
// DELETE ABSENCE
// =============================================================================

export async function deleteAbsence(id: string, driverId: string): Promise<void> {
  const supabase = await createClient();
  const validId = validateId(id, 'absence');
  const validDriverId = validateId(driverId, 'driver');

  const { error } = await supabase
    .from('absences')
    .delete()
    .eq('id', validId)
    .eq('driver_id', validDriverId);

  if (error) throw new Error(`Fehler beim Löschen der Abwesenheit: ${error.message}`);

  revalidatePath(`/drivers/${validDriverId}`);
}
