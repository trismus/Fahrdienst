'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { validateId, sanitizeSearchQuery } from '@/lib/utils/sanitize';
import { checkRateLimit, createRateLimitKey, RATE_LIMITS, RateLimitError } from '@/lib/utils/rate-limit';

// =============================================================================
// TYPES
// =============================================================================

export type RideStatus = 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type RideSubstatus =
  | 'waiting'
  | 'en_route_pickup'
  | 'at_pickup'
  | 'en_route_destination'
  | 'at_destination'
  | 'completed';

export interface Ride {
  id: string;
  patientId: string;
  driverId: string | null;
  destinationId: string;
  pickupTime: string;
  arrivalTime: string;
  returnTime: string | null;
  status: RideStatus;
  substatus: RideSubstatus | null;
  recurrenceGroup: string | null;
  estimatedDuration: number | null;
  estimatedDistance: number | null;
  // Execution timestamps (Sprint 4)
  startedAt: string | null;
  pickedUpAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RideRow {
  id: string;
  patient_id: string;
  driver_id: string | null;
  destination_id: string;
  pickup_time: string;
  arrival_time: string;
  return_time: string | null;
  status: RideStatus;
  substatus: RideSubstatus | null;
  recurrence_group: string | null;
  estimated_duration: number | null;
  estimated_distance: number | null;
  // Execution timestamps
  started_at: string | null;
  picked_up_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RideWithRelations extends Ride {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    street: string;
    postalCode: string;
    city: string;
    phone: string;
    needsWheelchair: boolean;
    needsWalker: boolean;
    needsAssistance: boolean;
    pickupInstructions?: string | null;
    notes?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  destination: {
    id: string;
    name: string;
    street: string;
    postalCode: string;
    city: string;
    phone?: string | null;
    arrivalInstructions?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const sanitizedString = (maxLength: number = 255) =>
  z
    .string()
    .max(maxLength)
    .transform((val) => val.trim())
    .refine((val) => !/<[^>]*>/g.test(val), {
      message: 'HTML tags are not allowed',
    });

const createRideSchema = z.object({
  patientId: z.string().uuid('Ungültige Patienten-ID'),
  destinationId: z.string().uuid('Ungültige Ziel-ID'),
  driverId: z.string().uuid('Ungültige Fahrer-ID').optional().nullable(),
  pickupTime: z.string().datetime('Ungültiges Datum/Uhrzeit Format'),
  arrivalTime: z.string().datetime('Ungültiges Datum/Uhrzeit Format'),
  returnTime: z.string().datetime('Ungültiges Datum/Uhrzeit Format').optional().nullable(),
  estimatedDuration: z.number().int().positive().optional().nullable(),
  estimatedDistance: z.number().positive().optional().nullable(),
  notes: sanitizedString(1000).optional().nullable(),
  createReturnRide: z.boolean().default(false),
}).refine(
  (data) => new Date(data.arrivalTime) > new Date(data.pickupTime),
  { message: 'Ankunftszeit muss nach Abholzeit liegen', path: ['arrivalTime'] }
).refine(
  (data) => !data.returnTime || new Date(data.returnTime) > new Date(data.arrivalTime),
  { message: 'Rückfahrtzeit muss nach Ankunftszeit liegen', path: ['returnTime'] }
);

const updateRideSchema = z.object({
  patientId: z.string().uuid('Ungültige Patienten-ID').optional(),
  destinationId: z.string().uuid('Ungültige Ziel-ID').optional(),
  driverId: z.string().uuid('Ungültige Fahrer-ID').optional().nullable(),
  pickupTime: z.string().datetime('Ungültiges Datum/Uhrzeit Format').optional(),
  arrivalTime: z.string().datetime('Ungültiges Datum/Uhrzeit Format').optional(),
  returnTime: z.string().datetime('Ungültiges Datum/Uhrzeit Format').optional().nullable(),
  status: z.enum(['planned', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  estimatedDuration: z.number().int().positive().optional().nullable(),
  estimatedDistance: z.number().positive().optional().nullable(),
  notes: sanitizedString(1000).optional().nullable(),
});

const cancelRideSchema = z.object({
  reason: sanitizedString(500).optional().nullable(),
});

export type CreateRideInput = z.infer<typeof createRideSchema>;
export type UpdateRideInput = z.infer<typeof updateRideSchema>;

// =============================================================================
// ROW TO ENTITY CONVERSION
// =============================================================================

function rideRowToEntity(row: RideRow): Ride {
  return {
    id: row.id,
    patientId: row.patient_id,
    driverId: row.driver_id,
    destinationId: row.destination_id,
    pickupTime: row.pickup_time,
    arrivalTime: row.arrival_time,
    returnTime: row.return_time,
    status: row.status,
    substatus: row.substatus,
    recurrenceGroup: row.recurrence_group,
    estimatedDuration: row.estimated_duration,
    estimatedDistance: row.estimated_distance,
    // Execution timestamps
    startedAt: row.started_at,
    pickedUpAt: row.picked_up_at,
    arrivedAt: row.arrived_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// VALIDATION HELPER
// =============================================================================

class ValidationError extends Error {
  public errors: z.ZodError['errors'];

  constructor(zodError: z.ZodError) {
    const message = zodError.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    super(`Validierungsfehler: ${message}`);
    this.name = 'ValidationError';
    this.errors = zodError.errors;
  }
}

function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  return result.data;
}

// =============================================================================
// READ OPERATIONS
// =============================================================================

export interface RideFilters {
  date?: string; // YYYY-MM-DD
  status?: RideStatus;
  driverId?: string;
  patientId?: string;
  fromDate?: string;
  toDate?: string;
  searchQuery?: string; // Freitext-Suche ueber Patient-Name, Destination-Name
  limit?: number;
  offset?: number;
}

export async function getRides(filters?: RideFilters): Promise<RideWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from('rides')
    .select(`
      *,
      patient:patients!inner(
        id, first_name, last_name, street, postal_code, city, phone,
        needs_wheelchair, needs_walker, needs_assistance,
        pickup_instructions, notes, latitude, longitude
      ),
      driver:drivers(id, first_name, last_name, phone),
      destination:destinations!inner(
        id, name, street, postal_code, city, phone,
        arrival_instructions, latitude, longitude
      )
    `)
    .order('pickup_time', { ascending: true });

  // Apply filters using parameterized queries (Supabase handles escaping)
  if (filters?.date) {
    // Filter by specific date
    const startOfDay = `${filters.date}T00:00:00.000Z`;
    const endOfDay = `${filters.date}T23:59:59.999Z`;
    query = query.gte('pickup_time', startOfDay).lte('pickup_time', endOfDay);
  }

  if (filters?.fromDate) {
    query = query.gte('pickup_time', filters.fromDate);
  }

  if (filters?.toDate) {
    query = query.lte('pickup_time', filters.toDate);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.driverId) {
    const validDriverId = validateId(filters.driverId, 'driver');
    query = query.eq('driver_id', validDriverId);
  }

  if (filters?.patientId) {
    const validPatientId = validateId(filters.patientId, 'patient');
    query = query.eq('patient_id', validPatientId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Fehler beim Laden der Fahrten: ${error.message}`);

  // Transform nested data
  let results = (data || []).map((row: Record<string, unknown>) => {
    const patient = row.patient as Record<string, unknown>;
    const driver = row.driver as Record<string, unknown> | null;
    const destination = row.destination as Record<string, unknown>;

    return {
      id: row.id as string,
      patientId: row.patient_id as string,
      driverId: row.driver_id as string | null,
      destinationId: row.destination_id as string,
      pickupTime: row.pickup_time as string,
      arrivalTime: row.arrival_time as string,
      returnTime: row.return_time as string | null,
      status: row.status as RideStatus,
      substatus: (row.substatus as RideSubstatus) || null,
      recurrenceGroup: row.recurrence_group as string | null,
      estimatedDuration: row.estimated_duration as number | null,
      estimatedDistance: row.estimated_distance as number | null,
      // Execution timestamps
      startedAt: row.started_at as string | null,
      pickedUpAt: row.picked_up_at as string | null,
      arrivedAt: row.arrived_at as string | null,
      completedAt: row.completed_at as string | null,
      cancelledAt: row.cancelled_at as string | null,
      cancellationReason: row.cancellation_reason as string | null,
      notes: row.notes as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      patient: {
        id: patient.id as string,
        firstName: patient.first_name as string,
        lastName: patient.last_name as string,
        street: patient.street as string,
        postalCode: (patient.postal_code as string) || '',
        city: patient.city as string,
        phone: patient.phone as string,
        needsWheelchair: patient.needs_wheelchair as boolean,
        needsWalker: patient.needs_walker as boolean,
        needsAssistance: patient.needs_assistance as boolean,
        pickupInstructions: patient.pickup_instructions as string | null,
        notes: patient.notes as string | null,
        latitude: patient.latitude as number | null,
        longitude: patient.longitude as number | null,
      },
      driver: driver ? {
        id: driver.id as string,
        firstName: driver.first_name as string,
        lastName: driver.last_name as string,
        phone: driver.phone as string,
      } : null,
      destination: {
        id: destination.id as string,
        name: destination.name as string,
        street: destination.street as string,
        postalCode: (destination.postal_code as string) || '',
        city: destination.city as string,
        phone: destination.phone as string | null,
        arrivalInstructions: destination.arrival_instructions as string | null,
        latitude: destination.latitude as number | null,
        longitude: destination.longitude as number | null,
      },
    };
  });

  // Apply text search filter (case-insensitive) over Patient and Destination names
  // This is done client-side because Supabase doesn't support search across JOINed tables
  if (filters?.searchQuery) {
    const sanitized = sanitizeSearchQuery(filters.searchQuery);
    if (sanitized) {
      const searchLower = sanitized.toLowerCase();
      results = results.filter((ride) => {
        const patientName = `${ride.patient.firstName} ${ride.patient.lastName}`.toLowerCase();
        const destinationName = ride.destination.name.toLowerCase();
        return patientName.includes(searchLower) || destinationName.includes(searchLower);
      });
    }
  }

  return results;
}

export async function getRideById(id: string): Promise<RideWithRelations | null> {
  const supabase = await createClient();
  const validId = validateId(id, 'ride');

  const { data, error } = await supabase
    .from('rides')
    .select(`
      *,
      patient:patients!inner(
        id, first_name, last_name, street, postal_code, city, phone,
        needs_wheelchair, needs_walker, needs_assistance,
        pickup_instructions, notes, latitude, longitude
      ),
      driver:drivers(id, first_name, last_name, phone),
      destination:destinations!inner(
        id, name, street, postal_code, city, phone,
        arrival_instructions, latitude, longitude
      )
    `)
    .eq('id', validId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Fehler beim Laden der Fahrt: ${error.message}`);
  }

  const patient = data.patient as Record<string, unknown>;
  const driver = data.driver as Record<string, unknown> | null;
  const destination = data.destination as Record<string, unknown>;

  return {
    id: data.id,
    patientId: data.patient_id,
    driverId: data.driver_id,
    destinationId: data.destination_id,
    pickupTime: data.pickup_time,
    arrivalTime: data.arrival_time,
    returnTime: data.return_time,
    status: data.status,
    substatus: data.substatus || null,
    recurrenceGroup: data.recurrence_group,
    estimatedDuration: data.estimated_duration,
    estimatedDistance: data.estimated_distance,
    startedAt: data.started_at,
    pickedUpAt: data.picked_up_at,
    arrivedAt: data.arrived_at,
    completedAt: data.completed_at,
    cancelledAt: data.cancelled_at,
    cancellationReason: data.cancellation_reason,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    patient: {
      id: patient.id as string,
      firstName: patient.first_name as string,
      lastName: patient.last_name as string,
      street: patient.street as string,
      postalCode: (patient.postal_code as string) || '',
      city: patient.city as string,
      phone: patient.phone as string,
      needsWheelchair: patient.needs_wheelchair as boolean,
      needsWalker: patient.needs_walker as boolean,
      needsAssistance: patient.needs_assistance as boolean,
      pickupInstructions: patient.pickup_instructions as string | null,
      notes: patient.notes as string | null,
      latitude: patient.latitude as number | null,
      longitude: patient.longitude as number | null,
    },
    driver: driver ? {
      id: driver.id as string,
      firstName: driver.first_name as string,
      lastName: driver.last_name as string,
      phone: driver.phone as string,
    } : null,
    destination: {
      id: destination.id as string,
      name: destination.name as string,
      street: destination.street as string,
      postalCode: (destination.postal_code as string) || '',
      city: destination.city as string,
      phone: destination.phone as string | null,
      arrivalInstructions: destination.arrival_instructions as string | null,
      latitude: destination.latitude as number | null,
      longitude: destination.longitude as number | null,
    },
  };
}

// =============================================================================
// CREATE OPERATIONS
// =============================================================================

export async function createRide(input: CreateRideInput): Promise<Ride> {
  const supabase = await createClient();

  // Rate limiting
  const { data: { user } } = await supabase.auth.getUser();
  const rateLimitKey = createRateLimitKey(user?.id || null, 'rides:create');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RATE_LIMITS.create);

  if (!rateLimitResult.success) {
    throw new RateLimitError(rateLimitResult.resetTime);
  }

  // Validate input
  const validatedInput = validate(createRideSchema, input);

  // Verify patient exists and is active
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, is_active')
    .eq('id', validatedInput.patientId)
    .single();

  if (patientError || !patient || !patient.is_active) {
    throw new Error('Patient nicht gefunden oder nicht aktiv');
  }

  // Verify destination exists and is active
  const { data: destination, error: destError } = await supabase
    .from('destinations')
    .select('id, is_active')
    .eq('id', validatedInput.destinationId)
    .single();

  if (destError || !destination || !destination.is_active) {
    throw new Error('Ziel nicht gefunden oder nicht aktiv');
  }

  // Verify driver exists and is active (if provided)
  if (validatedInput.driverId) {
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, is_active')
      .eq('id', validatedInput.driverId)
      .single();

    if (driverError || !driver || !driver.is_active) {
      throw new Error('Fahrer nicht gefunden oder nicht aktiv');
    }
  }

  // Generate recurrence group if creating return ride
  const recurrenceGroup = validatedInput.createReturnRide ? crypto.randomUUID() : null;

  // Create the outbound ride
  const { data: ride, error } = await supabase
    .from('rides')
    .insert({
      patient_id: validatedInput.patientId,
      destination_id: validatedInput.destinationId,
      driver_id: validatedInput.driverId || null,
      pickup_time: validatedInput.pickupTime,
      arrival_time: validatedInput.arrivalTime,
      return_time: validatedInput.returnTime || null,
      status: 'planned',
      recurrence_group: recurrenceGroup,
      estimated_duration: validatedInput.estimatedDuration || null,
      estimated_distance: validatedInput.estimatedDistance || null,
      notes: validatedInput.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Fehler beim Erstellen der Fahrt: ${error.message}`);

  // Create return ride if requested
  if (validatedInput.createReturnRide && validatedInput.returnTime) {
    // For return ride: swap patient address and destination
    // Return ride goes from destination to patient
    await supabase
      .from('rides')
      .insert({
        patient_id: validatedInput.patientId,
        destination_id: validatedInput.destinationId,
        driver_id: validatedInput.driverId || null,
        pickup_time: validatedInput.returnTime,
        arrival_time: new Date(
          new Date(validatedInput.returnTime).getTime() +
          (validatedInput.estimatedDuration || 30) * 60 * 1000
        ).toISOString(),
        status: 'planned',
        recurrence_group: recurrenceGroup,
        estimated_duration: validatedInput.estimatedDuration || null,
        estimated_distance: validatedInput.estimatedDistance || null,
        notes: validatedInput.notes ? `[Rückfahrt] ${validatedInput.notes}` : '[Rückfahrt]',
      });
  }

  revalidatePath('/rides');
  revalidatePath('/dashboard');
  return rideRowToEntity(ride);
}

// =============================================================================
// UPDATE OPERATIONS
// =============================================================================

export async function updateRide(id: string, input: UpdateRideInput): Promise<Ride> {
  const supabase = await createClient();
  const validId = validateId(id, 'ride');

  // Validate input
  const validatedInput = validate(updateRideSchema, input);

  // Get current ride to check status
  const { data: currentRide, error: fetchError } = await supabase
    .from('rides')
    .select('status')
    .eq('id', validId)
    .single();

  if (fetchError) {
    throw new Error(`Fahrt nicht gefunden`);
  }

  // Prevent editing completed or cancelled rides (except notes)
  if (currentRide.status === 'completed' || currentRide.status === 'cancelled') {
    const onlyNotes = Object.keys(validatedInput).every(
      (key) => key === 'notes'
    );
    if (!onlyNotes) {
      throw new Error('Abgeschlossene oder stornierte Fahrten können nicht bearbeitet werden');
    }
  }

  // Build update object
  const updateData: Partial<RideRow> = {};

  if (validatedInput.patientId !== undefined) updateData.patient_id = validatedInput.patientId;
  if (validatedInput.destinationId !== undefined) updateData.destination_id = validatedInput.destinationId;
  if (validatedInput.driverId !== undefined) updateData.driver_id = validatedInput.driverId;
  if (validatedInput.pickupTime !== undefined) updateData.pickup_time = validatedInput.pickupTime;
  if (validatedInput.arrivalTime !== undefined) updateData.arrival_time = validatedInput.arrivalTime;
  if (validatedInput.returnTime !== undefined) updateData.return_time = validatedInput.returnTime;
  if (validatedInput.status !== undefined) updateData.status = validatedInput.status;
  if (validatedInput.estimatedDuration !== undefined) updateData.estimated_duration = validatedInput.estimatedDuration;
  if (validatedInput.estimatedDistance !== undefined) updateData.estimated_distance = validatedInput.estimatedDistance;
  if (validatedInput.notes !== undefined) updateData.notes = validatedInput.notes;

  const { data: ride, error } = await supabase
    .from('rides')
    .update(updateData)
    .eq('id', validId)
    .select()
    .single();

  if (error) throw new Error(`Fehler beim Aktualisieren der Fahrt: ${error.message}`);

  revalidatePath('/rides');
  revalidatePath(`/rides/${validId}`);
  revalidatePath('/dashboard');
  return rideRowToEntity(ride);
}

// =============================================================================
// STATUS TRANSITIONS
// =============================================================================

// Valid status transitions
const validTransitions: Record<RideStatus, RideStatus[]> = {
  planned: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled', 'planned'], // Can revert to planned if driver rejects
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

export async function assignDriver(rideId: string, driverId: string): Promise<Ride> {
  return updateRide(rideId, { driverId });
}

export async function unassignDriver(rideId: string): Promise<Ride> {
  return updateRide(rideId, { driverId: null, status: 'planned' });
}

export async function confirmRide(rideId: string): Promise<Ride> {
  const validId = validateId(rideId, 'ride');
  const ride = await getRideById(validId);

  if (!ride) throw new Error('Fahrt nicht gefunden');
  if (!validTransitions[ride.status].includes('confirmed')) {
    throw new Error(`Fahrt kann nicht bestätigt werden (aktueller Status: ${ride.status})`);
  }
  if (!ride.driverId) {
    throw new Error('Fahrt kann nicht bestätigt werden ohne zugewiesenen Fahrer');
  }

  return updateRide(rideId, { status: 'confirmed' });
}

export async function rejectRide(rideId: string): Promise<Ride> {
  const validId = validateId(rideId, 'ride');
  const ride = await getRideById(validId);

  if (!ride) throw new Error('Fahrt nicht gefunden');

  // Driver rejects: remove assignment and set back to planned
  return updateRide(rideId, { driverId: null, status: 'planned' });
}

export async function startRide(rideId: string): Promise<Ride> {
  const validId = validateId(rideId, 'ride');
  const ride = await getRideById(validId);

  if (!ride) throw new Error('Fahrt nicht gefunden');
  if (!validTransitions[ride.status].includes('in_progress')) {
    throw new Error(`Fahrt kann nicht gestartet werden (aktueller Status: ${ride.status})`);
  }

  return updateRide(rideId, { status: 'in_progress' });
}

export async function completeRide(rideId: string): Promise<Ride> {
  const validId = validateId(rideId, 'ride');
  const ride = await getRideById(validId);

  if (!ride) throw new Error('Fahrt nicht gefunden');
  if (!validTransitions[ride.status].includes('completed')) {
    throw new Error(`Fahrt kann nicht abgeschlossen werden (aktueller Status: ${ride.status})`);
  }

  return updateRide(rideId, { status: 'completed' });
}

export async function cancelRide(rideId: string, reason?: string): Promise<Ride> {
  const supabase = await createClient();
  const validId = validateId(rideId, 'ride');

  // Validate reason if provided
  const validatedReason = reason
    ? validate(cancelRideSchema, { reason }).reason
    : null;

  const ride = await getRideById(validId);

  if (!ride) throw new Error('Fahrt nicht gefunden');
  if (!validTransitions[ride.status].includes('cancelled')) {
    throw new Error(`Fahrt kann nicht storniert werden (aktueller Status: ${ride.status})`);
  }

  const { data, error } = await supabase
    .from('rides')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: validatedReason,
    })
    .eq('id', validId)
    .select()
    .single();

  if (error) throw new Error(`Fehler beim Stornieren der Fahrt: ${error.message}`);

  revalidatePath('/rides');
  revalidatePath(`/rides/${validId}`);
  revalidatePath('/dashboard');
  return rideRowToEntity(data);
}

// =============================================================================
// DELETE OPERATIONS (Hard delete - use with caution)
// =============================================================================

export async function deleteRide(id: string): Promise<void> {
  const supabase = await createClient();
  const validId = validateId(id, 'ride');

  const { error } = await supabase
    .from('rides')
    .delete()
    .eq('id', validId);

  if (error) throw new Error(`Fehler beim Löschen der Fahrt: ${error.message}`);

  revalidatePath('/rides');
  revalidatePath('/dashboard');
}

// =============================================================================
// STATISTICS
// =============================================================================

export async function getRideStats(date?: string): Promise<{
  total: number;
  planned: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  unassigned: number;
}> {
  const supabase = await createClient();

  const targetDate = date || new Date().toISOString().split('T')[0];
  const startOfDay = `${targetDate}T00:00:00.000Z`;
  const endOfDay = `${targetDate}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from('rides')
    .select('status, driver_id')
    .gte('pickup_time', startOfDay)
    .lte('pickup_time', endOfDay);

  if (error) throw new Error(`Fehler beim Laden der Statistiken: ${error.message}`);

  const stats = {
    total: data.length,
    planned: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    unassigned: 0,
  };

  for (const ride of data) {
    switch (ride.status) {
      case 'planned':
        stats.planned++;
        break;
      case 'confirmed':
        stats.confirmed++;
        break;
      case 'in_progress':
        stats.inProgress++;
        break;
      case 'completed':
        stats.completed++;
        break;
      case 'cancelled':
        stats.cancelled++;
        break;
    }

    if (!ride.driver_id && ride.status !== 'cancelled') {
      stats.unassigned++;
    }
  }

  return stats;
}
