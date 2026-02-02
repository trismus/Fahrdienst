'use server';

/**
 * @deprecated SECURITY: All functions in this file are deprecated.
 * Use destinations-v2.ts instead which includes:
 * - Input validation with Zod schemas
 * - SQL injection prevention
 * - Rate limiting
 * - ID format validation
 *
 * These functions throw errors to prevent accidental usage.
 */

import type { Destination } from '@/types';

export interface CreateDestinationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  arrival_window_start: string;
  arrival_window_end: string;
}

const DEPRECATION_ERROR = 'DEPRECATED: This function lacks security controls. Use the corresponding function from destinations-v2.ts instead.';

/**
 * @deprecated Use getDestinations from destinations-v2.ts instead
 * This function lacks proper security controls
 */
export async function getDestinations(): Promise<Destination[]> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use getDestinationById from destinations-v2.ts instead
 * This function lacks proper security controls
 */
export async function getDestination(_id: string): Promise<Destination | null> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use createDestination from destinations-v2.ts instead
 * This function lacks proper security controls (no input validation, no rate limiting)
 */
export async function createDestination(_data: CreateDestinationData): Promise<Destination> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use updateDestination from destinations-v2.ts instead
 * This function lacks proper security controls (no input validation, no ID validation)
 */
export async function updateDestination(_id: string, _data: Partial<CreateDestinationData>): Promise<Destination> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use deactivateDestination from destinations-v2.ts instead
 * This function performs hard delete instead of soft delete and lacks security controls
 */
export async function deleteDestination(_id: string): Promise<void> {
  throw new Error(DEPRECATION_ERROR);
}
