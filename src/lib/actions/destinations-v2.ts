'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  Destination,
  DestinationRow,
  CreateDestinationInput,
  UpdateDestinationInput,
  DestinationType,
  destinationRowToEntity,
  destinationInputToRow,
} from '@/types/database';
import { sanitizeSearchQuery, validateId } from '@/lib/utils/sanitize';

// =============================================================================
// READ OPERATIONS
// =============================================================================

export async function getDestinations(includeInactive = false): Promise<Destination[]> {
  const supabase = await createClient();

  let query = supabase
    .from('destinations')
    .select('*')
    .order('name');

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch destinations: ${error.message}`);

  return (data as DestinationRow[]).map(destinationRowToEntity);
}

export async function getDestinationById(id: string): Promise<Destination | null> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'destination');

  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('id', validId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch destination: ${error.message}`);
  }

  return destinationRowToEntity(data as DestinationRow);
}

export async function getDestinationsByType(type: DestinationType): Promise<Destination[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('destination_type', type)
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(`Failed to fetch destinations: ${error.message}`);

  return (data as DestinationRow[]).map(destinationRowToEntity);
}

export async function searchDestinations(query: string): Promise<Destination[]> {
  const supabase = await createClient();

  // Sanitize input to prevent SQL injection
  const sanitized = sanitizeSearchQuery(query);

  if (!sanitized) {
    return [];
  }

  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${sanitized}%,department.ilike.%${sanitized}%,city.ilike.%${sanitized}%`)
    .order('name')
    .limit(20);

  if (error) throw new Error(`Failed to search destinations: ${error.message}`);

  return (data as DestinationRow[]).map(destinationRowToEntity);
}

// =============================================================================
// CREATE OPERATIONS
// =============================================================================

export async function createDestination(input: CreateDestinationInput): Promise<Destination> {
  const supabase = await createClient();

  const row = destinationInputToRow(input);

  const { data, error } = await supabase
    .from('destinations')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create destination: ${error.message}`);

  revalidatePath('/destinations');
  return destinationRowToEntity(data as DestinationRow);
}

// =============================================================================
// UPDATE OPERATIONS
// =============================================================================

export async function updateDestination(id: string, input: UpdateDestinationInput): Promise<Destination> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'destination');

  const row: Partial<DestinationRow> = {};

  if (input.externalId !== undefined) row.external_id = input.externalId;
  if (input.name !== undefined) row.name = input.name;
  if (input.destinationType !== undefined) row.destination_type = input.destinationType;
  if (input.department !== undefined) row.department = input.department;
  if (input.street !== undefined) row.street = input.street;
  if (input.postalCode !== undefined) row.postal_code = input.postalCode;
  if (input.city !== undefined) row.city = input.city;
  if (input.country !== undefined) row.country = input.country;
  if (input.latitude !== undefined) row.latitude = input.latitude;
  if (input.longitude !== undefined) row.longitude = input.longitude;
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.email !== undefined) row.email = input.email;
  if (input.openingHours !== undefined) row.opening_hours = input.openingHours;
  if (input.arrivalInstructions !== undefined) row.arrival_instructions = input.arrivalInstructions;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.isActive !== undefined) row.is_active = input.isActive;

  const { data, error } = await supabase
    .from('destinations')
    .update(row)
    .eq('id', validId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update destination: ${error.message}`);

  revalidatePath('/destinations');
  revalidatePath(`/destinations/${validId}`);
  return destinationRowToEntity(data as DestinationRow);
}

// =============================================================================
// DEACTIVATE (Soft Delete)
// =============================================================================

export async function deactivateDestination(id: string): Promise<void> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'destination');

  const { error } = await supabase
    .from('destinations')
    .update({ is_active: false })
    .eq('id', validId);

  if (error) throw new Error(`Failed to deactivate destination: ${error.message}`);

  revalidatePath('/destinations');
}

export async function reactivateDestination(id: string): Promise<void> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'destination');

  const { error } = await supabase
    .from('destinations')
    .update({ is_active: true })
    .eq('id', validId);

  if (error) throw new Error(`Failed to reactivate destination: ${error.message}`);

  revalidatePath('/destinations');
}
