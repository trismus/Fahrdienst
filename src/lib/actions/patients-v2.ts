'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  Patient,
  PatientRow,
  CreatePatientInput,
  UpdatePatientInput,
  patientRowToEntity,
  patientInputToRow,
} from '@/types/database';
import { sanitizeSearchQuery, validateId } from '@/lib/utils/sanitize';

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

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  const supabase = await createClient();

  const row = patientInputToRow(input);

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

export async function updatePatient(id: string, input: UpdatePatientInput): Promise<Patient> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'patient');

  const row: Partial<PatientRow> = {};

  if (input.patientNumber !== undefined) row.patient_number = input.patientNumber;
  if (input.firstName !== undefined) row.first_name = input.firstName;
  if (input.lastName !== undefined) row.last_name = input.lastName;
  if (input.dateOfBirth !== undefined) row.date_of_birth = input.dateOfBirth;
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.email !== undefined) row.email = input.email;
  if (input.street !== undefined) row.street = input.street;
  if (input.postalCode !== undefined) row.postal_code = input.postalCode;
  if (input.city !== undefined) row.city = input.city;
  if (input.country !== undefined) row.country = input.country;
  if (input.latitude !== undefined) row.latitude = input.latitude;
  if (input.longitude !== undefined) row.longitude = input.longitude;
  if (input.pickupInstructions !== undefined) row.pickup_instructions = input.pickupInstructions;
  if (input.needsWheelchair !== undefined) row.needs_wheelchair = input.needsWheelchair;
  if (input.needsWalker !== undefined) row.needs_walker = input.needsWalker;
  if (input.needsAssistance !== undefined) row.needs_assistance = input.needsAssistance;
  if (input.emergencyContactName !== undefined) row.emergency_contact_name = input.emergencyContactName;
  if (input.emergencyContactPhone !== undefined) row.emergency_contact_phone = input.emergencyContactPhone;
  if (input.insurance !== undefined) row.insurance = input.insurance;
  if (input.costCenter !== undefined) row.cost_center = input.costCenter;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.isActive !== undefined) row.is_active = input.isActive;

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
