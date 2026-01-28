'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  Patient,
  PatientRow,
  patientRowToEntity,
  patientInputToRow,
} from '@/types/database';
import { sanitizeSearchQuery, validateId } from '@/lib/utils/sanitize';
import {
  createPatientSchema,
  updatePatientSchema,
  validate,
  type CreatePatientInput as ZodCreatePatientInput,
  type UpdatePatientInput as ZodUpdatePatientInput,
} from '@/lib/validations/schemas';
import { checkRateLimit, createRateLimitKey, RATE_LIMITS, RateLimitError } from '@/lib/utils/rate-limit';
import type { CreatePatientInput } from '@/types/database';

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

export async function getPatients(includeInactive = false): Promise<Patient[]> {
  const supabase = await createClient();

  let query = supabase
    .from('patients')
    .select('*')
    .order('last_name')
    .order('first_name');

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch patients: ${error.message}`);

  return (data as PatientRow[]).map(patientRowToEntity);
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'patient');

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', validId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch patient: ${error.message}`);
  }

  return patientRowToEntity(data as PatientRow);
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const supabase = await createClient();

  // Rate limiting: get user ID for rate limit key
  const { data: { user } } = await supabase.auth.getUser();
  const rateLimitKey = createRateLimitKey(user?.id || null, 'search:patients');
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
    .from('patients')
    .select('*')
    .eq('is_active', true)
    .or(`first_name.ilike.%${sanitized}%,last_name.ilike.%${sanitized}%,patient_number.ilike.%${sanitized}%`)
    .order('last_name')
    .limit(20);

  if (error) throw new Error(`Failed to search patients: ${error.message}`);

  return (data as PatientRow[]).map(patientRowToEntity);
}

// =============================================================================
// CREATE OPERATIONS
// =============================================================================

export async function createPatient(input: ZodCreatePatientInput): Promise<Patient> {
  const supabase = await createClient();

  // Validate input to prevent XSS and ensure data integrity
  const validatedInput = validate(createPatientSchema, input);
  // Convert null values to undefined for type compatibility
  const convertedInput = nullToUndefined(validatedInput) as unknown as CreatePatientInput;
  const row = patientInputToRow(convertedInput);

  const { data, error } = await supabase
    .from('patients')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create patient: ${error.message}`);

  revalidatePath('/patients');
  return patientRowToEntity(data as PatientRow);
}

// =============================================================================
// UPDATE OPERATIONS
// =============================================================================

export async function updatePatient(id: string, input: ZodUpdatePatientInput): Promise<Patient> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'patient');

  // Validate input to prevent XSS and ensure data integrity
  const validatedInput = validate(updatePatientSchema, input);

  const row: Partial<PatientRow> = {};

  if (validatedInput.patientNumber !== undefined) row.patient_number = validatedInput.patientNumber;
  if (validatedInput.firstName !== undefined) row.first_name = validatedInput.firstName;
  if (validatedInput.lastName !== undefined) row.last_name = validatedInput.lastName;
  if (validatedInput.dateOfBirth !== undefined) row.date_of_birth = validatedInput.dateOfBirth;
  if (validatedInput.phone !== undefined) row.phone = validatedInput.phone;
  if (validatedInput.email !== undefined) row.email = validatedInput.email;
  if (validatedInput.street !== undefined) row.street = validatedInput.street;
  if (validatedInput.postalCode !== undefined) row.postal_code = validatedInput.postalCode;
  if (validatedInput.city !== undefined) row.city = validatedInput.city;
  if (validatedInput.country !== undefined) row.country = validatedInput.country;
  if (validatedInput.latitude !== undefined) row.latitude = validatedInput.latitude;
  if (validatedInput.longitude !== undefined) row.longitude = validatedInput.longitude;
  if (validatedInput.pickupInstructions !== undefined) row.pickup_instructions = validatedInput.pickupInstructions;
  if (validatedInput.needsWheelchair !== undefined) row.needs_wheelchair = validatedInput.needsWheelchair;
  if (validatedInput.needsWalker !== undefined) row.needs_walker = validatedInput.needsWalker;
  if (validatedInput.needsAssistance !== undefined) row.needs_assistance = validatedInput.needsAssistance;
  if (validatedInput.emergencyContactName !== undefined) row.emergency_contact_name = validatedInput.emergencyContactName;
  if (validatedInput.emergencyContactPhone !== undefined) row.emergency_contact_phone = validatedInput.emergencyContactPhone;
  if (validatedInput.insurance !== undefined) row.insurance = validatedInput.insurance;
  if (validatedInput.costCenter !== undefined) row.cost_center = validatedInput.costCenter;
  if (validatedInput.notes !== undefined) row.notes = validatedInput.notes;
  if (validatedInput.isActive !== undefined) row.is_active = validatedInput.isActive;

  const { data, error } = await supabase
    .from('patients')
    .update(row)
    .eq('id', validId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update patient: ${error.message}`);

  revalidatePath('/patients');
  revalidatePath(`/patients/${validId}`);
  return patientRowToEntity(data as PatientRow);
}

// =============================================================================
// DEACTIVATE (Soft Delete)
// =============================================================================

export async function deactivatePatient(id: string): Promise<void> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'patient');

  const { error } = await supabase
    .from('patients')
    .update({ is_active: false })
    .eq('id', validId);

  if (error) throw new Error(`Failed to deactivate patient: ${error.message}`);

  revalidatePath('/patients');
}

export async function reactivatePatient(id: string): Promise<void> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'patient');

  const { error } = await supabase
    .from('patients')
    .update({ is_active: true })
    .eq('id', validId);

  if (error) throw new Error(`Failed to reactivate patient: ${error.message}`);

  revalidatePath('/patients');
}
