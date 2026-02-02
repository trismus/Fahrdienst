'use server';

/**
 * @deprecated SECURITY: All functions in this file are deprecated.
 * Use patients-v2.ts instead which includes:
 * - Input validation with Zod schemas
 * - SQL injection prevention
 * - Rate limiting
 * - ID format validation
 *
 * These functions throw errors to prevent accidental usage.
 */

import type { Patient } from '@/types';

export interface CreatePatientData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  special_needs?: string;
  notes?: string;
}

const DEPRECATION_ERROR = 'DEPRECATED: This function lacks security controls. Use the corresponding function from patients-v2.ts instead.';

/**
 * @deprecated Use getPatients from patients-v2.ts instead
 * This function lacks proper security controls
 */
export async function getPatients(): Promise<Patient[]> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use getPatientById from patients-v2.ts instead
 * This function lacks proper security controls
 */
export async function getPatient(_id: string): Promise<Patient | null> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use createPatient from patients-v2.ts instead
 * This function lacks proper security controls (no input validation, no rate limiting)
 */
export async function createPatient(_data: CreatePatientData): Promise<Patient> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use updatePatient from patients-v2.ts instead
 * This function lacks proper security controls (no input validation, no ID validation)
 */
export async function updatePatient(_id: string, _data: Partial<CreatePatientData>): Promise<Patient> {
  throw new Error(DEPRECATION_ERROR);
}

/**
 * @deprecated Use deactivatePatient from patients-v2.ts instead
 * This function performs hard delete instead of soft delete and lacks security controls
 */
export async function deletePatient(_id: string): Promise<void> {
  throw new Error(DEPRECATION_ERROR);
}
