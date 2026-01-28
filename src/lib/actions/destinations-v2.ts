'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  Destination,
  DestinationRow,
  DestinationType,
  destinationRowToEntity,
  destinationInputToRow,
} from '@/types/database';
import { sanitizeSearchQuery, validateId } from '@/lib/utils/sanitize';
import {
  createDestinationSchema,
  updateDestinationSchema,
  destinationTypeSchema,
  validate,
  type CreateDestinationInput as ZodCreateDestinationInput,
  type UpdateDestinationInput as ZodUpdateDestinationInput,
} from '@/lib/validations/schemas';
import { checkRateLimit, createRateLimitKey, RATE_LIMITS, RateLimitError } from '@/lib/utils/rate-limit';
import type { CreateDestinationInput } from '@/types/database';

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

  // Validate type to ensure it's a valid enum value
  const validType = validate(destinationTypeSchema, type);

  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('destination_type', validType)
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(`Failed to fetch destinations: ${error.message}`);

  return (data as DestinationRow[]).map(destinationRowToEntity);
}

export async function searchDestinations(query: string): Promise<Destination[]> {
  const supabase = await createClient();

  // Rate limiting: get user ID for rate limit key
  const { data: { user } } = await supabase.auth.getUser();
  const rateLimitKey = createRateLimitKey(user?.id || null, 'search:destinations');
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

export async function createDestination(input: ZodCreateDestinationInput): Promise<Destination> {
  const supabase = await createClient();

  // Validate input to prevent XSS and ensure data integrity
  const validatedInput = validate(createDestinationSchema, input);
  // Convert null values to undefined for type compatibility
  const convertedInput = nullToUndefined(validatedInput) as unknown as CreateDestinationInput;
  const row = destinationInputToRow(convertedInput);

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

export async function updateDestination(id: string, input: ZodUpdateDestinationInput): Promise<Destination> {
  const supabase = await createClient();

  // Validate ID format to prevent injection
  const validId = validateId(id, 'destination');

  // Validate input to prevent XSS and ensure data integrity
  const validatedInput = validate(updateDestinationSchema, input);

  const row: Partial<DestinationRow> = {};

  if (validatedInput.externalId !== undefined) row.external_id = validatedInput.externalId;
  if (validatedInput.name !== undefined) row.name = validatedInput.name;
  if (validatedInput.destinationType !== undefined) row.destination_type = validatedInput.destinationType;
  if (validatedInput.department !== undefined) row.department = validatedInput.department;
  if (validatedInput.street !== undefined) row.street = validatedInput.street;
  if (validatedInput.postalCode !== undefined) row.postal_code = validatedInput.postalCode;
  if (validatedInput.city !== undefined) row.city = validatedInput.city;
  if (validatedInput.country !== undefined) row.country = validatedInput.country;
  if (validatedInput.latitude !== undefined) row.latitude = validatedInput.latitude;
  if (validatedInput.longitude !== undefined) row.longitude = validatedInput.longitude;
  if (validatedInput.phone !== undefined) row.phone = validatedInput.phone;
  if (validatedInput.email !== undefined) row.email = validatedInput.email;
  if (validatedInput.openingHours !== undefined) row.opening_hours = validatedInput.openingHours;
  if (validatedInput.arrivalInstructions !== undefined) row.arrival_instructions = validatedInput.arrivalInstructions;
  if (validatedInput.notes !== undefined) row.notes = validatedInput.notes;
  if (validatedInput.isActive !== undefined) row.is_active = validatedInput.isActive;

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
