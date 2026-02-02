'use server';

/**
 * @deprecated SECURITY: Most functions in this file are deprecated.
 * Use drivers-v2.ts instead which includes:
 * - Input validation with Zod schemas
 * - SQL injection prevention
 * - Rate limiting
 * - ID format validation
 *
 * The following functions still work for backwards compatibility:
 * - setAvailabilityBlock (redirects to drivers-v2.ts)
 * - deleteAvailabilityBlock (redirects to drivers-v2.ts)
 * - createAbsence (redirects to drivers-v2.ts)
 * - deleteAbsence (redirects to drivers-v2.ts)
 */

import type { Driver, DriverWithAvailability, AvailabilityBlock, Absence } from '@/types';
import {
  createAvailabilityBlock as createAvailabilityBlockV2,
  deleteAvailabilityBlock as deleteAvailabilityBlockV2,
  createAbsence as createAbsenceV2,
  deleteAbsence as deleteAbsenceV2,
} from './drivers-v2';

const DEPRECATION_ERROR = 'DEPRECATED: This function lacks security controls. Use the corresponding function from drivers-v2.ts instead.';

// =============================================================================
// DEPRECATED FUNCTIONS - These throw errors
// =============================================================================

export interface CreateDriverData {
  name: string;
  phone: string;
  email: string;
}

/**
 * @deprecated Use getDrivers from drivers-v2.ts instead
 */
export async function getDrivers(): Promise<Driver[]> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use getDriverById from drivers-v2.ts instead
 */
export async function getDriver(_id: string): Promise<Driver | null> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use getDriverById + getDriverAvailabilityBlocks + getDriverAbsences from drivers-v2.ts
 */
export async function getDriverWithAvailability(_id: string): Promise<DriverWithAvailability | null> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use createDriver from drivers-v2.ts instead
 */
export async function createDriver(_data: CreateDriverData): Promise<Driver> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use updateDriver from drivers-v2.ts instead
 */
export async function updateDriver(_id: string, _data: Partial<CreateDriverData>): Promise<Driver> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use deactivateDriver from drivers-v2.ts instead
 */
export async function deleteDriver(_id: string): Promise<void> {
  throw new Error(DEPRECATION_ERROR);
}

// =============================================================================
// BACKWARDS COMPATIBLE FUNCTIONS - These redirect to v2
// =============================================================================

export interface CreateAvailabilityBlockData {
  driver_id: string;
  weekday: string;
  start_time: string;
  end_time: string;
}

/**
 * Creates an availability block for a driver.
 * Redirects to drivers-v2.ts for proper validation.
 */
export async function setAvailabilityBlock(data: CreateAvailabilityBlockData): Promise<AvailabilityBlock> {
  const result = await createAvailabilityBlockV2({
    driverId: data.driver_id,
    weekday: data.weekday as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday',
    startTime: data.start_time,
    endTime: data.end_time,
  });

  // Map v2 result back to legacy format
  return {
    id: result.id,
    driver_id: result.driverId,
    weekday: result.weekday,
    start_time: result.startTime,
    end_time: result.endTime,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Deletes an availability block.
 * Redirects to drivers-v2.ts for proper validation.
 */
export async function deleteAvailabilityBlock(id: string, driverId: string): Promise<void> {
  await deleteAvailabilityBlockV2(id, driverId);
}

// Absences
export interface CreateAbsenceData {
  driver_id: string;
  from_date: string;
  to_date: string;
  reason?: string;
}

/**
 * Creates an absence for a driver.
 * Redirects to drivers-v2.ts for proper validation.
 */
export async function createAbsence(data: CreateAbsenceData): Promise<Absence> {
  const result = await createAbsenceV2({
    driverId: data.driver_id,
    fromDate: data.from_date,
    toDate: data.to_date,
    reason: data.reason,
  });

  // Map v2 result back to legacy format
  return {
    id: result.id,
    driver_id: result.driverId,
    from_date: result.fromDate,
    to_date: result.toDate,
    reason: result.reason || undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Deletes an absence.
 * Redirects to drivers-v2.ts for proper validation.
 */
export async function deleteAbsence(id: string, driverId: string): Promise<void> {
  await deleteAbsenceV2(id, driverId);
}
