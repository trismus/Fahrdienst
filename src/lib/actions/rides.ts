'use server';

/**
 * @deprecated SECURITY: All functions in this file are deprecated.
 * Use rides-v2.ts instead which includes:
 * - Input validation with Zod schemas
 * - SQL injection prevention
 * - Rate limiting
 * - ID format validation
 * - Proper status transition validation
 *
 * These functions throw errors to prevent accidental usage.
 */

import type { Ride, RideWithRelations, RideStatus } from '@/types';

export interface CreateRideData {
  patient_id: string;
  driver_id?: string;
  destination_id: string;
  pickup_time: string;
  arrival_time: string;
  return_time?: string;
  status?: RideStatus;
  recurrence_group?: string;
  estimated_duration?: number;
  estimated_distance?: number;
}

const DEPRECATION_ERROR = 'DEPRECATED: This function lacks security controls. Use the corresponding function from rides-v2.ts instead.';

/**
 * @deprecated Use getRides from rides-v2.ts instead
 * This function lacks proper security controls
 */
export async function getRides(_filters?: {
  driverId?: string;
  status?: RideStatus;
  fromDate?: string;
  toDate?: string;
}): Promise<RideWithRelations[]> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use getRideById from rides-v2.ts instead
 * This function lacks proper security controls
 */
export async function getRide(_id: string): Promise<RideWithRelations | null> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use getRides with driverId filter from rides-v2.ts instead
 */
export async function getRidesForDriver(_driverId: string): Promise<RideWithRelations[]> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use getRides with date filter from rides-v2.ts instead
 */
export async function getTodaysRidesForDriver(_driverId: string): Promise<RideWithRelations[]> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use createRide from rides-v2.ts instead
 * This function lacks proper security controls (no input validation, no rate limiting)
 */
export async function createRide(_data: CreateRideData): Promise<Ride> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use updateRide from rides-v2.ts instead
 * This function lacks proper security controls (no input validation, no ID validation)
 */
export async function updateRide(_id: string, _data: Partial<CreateRideData>): Promise<Ride> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use deleteRide from rides-v2.ts instead (or cancelRide for soft delete)
 * This function performs hard delete and lacks security controls
 */
export async function deleteRide(_id: string): Promise<void> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use assignDriver from rides-v2.ts instead
 */
export async function assignDriver(_rideId: string, _driverId: string): Promise<Ride> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use confirmRide from rides-v2.ts instead
 * This function lacks proper status transition validation
 */
export async function confirmRide(_rideId: string): Promise<Ride> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use rejectRide from rides-v2.ts instead
 * This function lacks proper status transition validation
 */
export async function rejectRide(_rideId: string): Promise<Ride> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use startRide from rides-v2.ts instead
 * This function lacks proper status transition validation
 */
export async function startRide(_rideId: string): Promise<Ride> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use completeRide from rides-v2.ts instead
 * This function lacks proper status transition validation
 */
export async function completeRide(_rideId: string): Promise<Ride> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use cancelRide from rides-v2.ts instead
 * This function lacks proper status transition validation
 */
export async function cancelRide(_rideId: string): Promise<Ride> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated This function should be reimplemented in rides-v2.ts with proper validation
 * Current implementation lacks security controls
 */
export async function createRecurringRides(
  _baseData: Omit<CreateRideData, 'recurrence_group'>,
  _pattern: {
    daysOfWeek: number[];
    weeks: number;
  }
): Promise<Ride[]> {
  throw new Error(DEPRECATION_ERROR);
}
