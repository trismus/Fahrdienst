'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { validateId } from '@/lib/utils/sanitize';
import type { RideWithRelations, RideStatus, RideSubstatus } from './rides-v2';
import {
  notifyRideConfirmed,
  notifyRideStarted,
  notifyDriverArrived,
  notifyPatientPickedUp,
  notifyRideCompleted,
} from '@/lib/sms';

// =============================================================================
// DRIVER-SPECIFIC RIDE ACTIONS
// =============================================================================

/**
 * Gets all rides assigned to a specific driver.
 * Returns rides with full patient, destination, and driver details.
 */
export async function getDriverRides(driverId: string): Promise<RideWithRelations[]> {
  const supabase = await createClient();
  const validId = validateId(driverId, 'driver');

  const { data, error } = await supabase
    .from('rides')
    .select(`
      *,
      patient:patients!inner(
        id, first_name, last_name, street, postal_code, city, phone,
        needs_wheelchair, needs_walker, needs_assistance,
        pickup_instructions, latitude, longitude
      ),
      driver:drivers(id, first_name, last_name, phone),
      destination:destinations!inner(
        id, name, street, postal_code, city, phone,
        arrival_instructions, latitude, longitude
      )
    `)
    .eq('driver_id', validId)
    .not('status', 'eq', 'cancelled')
    .order('pickup_time', { ascending: true });

  if (error) throw new Error(`Fehler beim Laden der Fahrten: ${error.message}`);

  return transformRideRows(data || []);
}

/**
 * Gets rides for a driver filtered by date range.
 */
export async function getDriverRidesForDateRange(
  driverId: string,
  fromDate: string,
  toDate: string
): Promise<RideWithRelations[]> {
  const supabase = await createClient();
  const validId = validateId(driverId, 'driver');

  const { data, error } = await supabase
    .from('rides')
    .select(`
      *,
      patient:patients!inner(
        id, first_name, last_name, street, postal_code, city, phone,
        needs_wheelchair, needs_walker, needs_assistance,
        pickup_instructions, latitude, longitude
      ),
      driver:drivers(id, first_name, last_name, phone),
      destination:destinations!inner(
        id, name, street, postal_code, city, phone,
        arrival_instructions, latitude, longitude
      )
    `)
    .eq('driver_id', validId)
    .gte('pickup_time', fromDate)
    .lte('pickup_time', toDate)
    .not('status', 'eq', 'cancelled')
    .order('pickup_time', { ascending: true });

  if (error) throw new Error(`Fehler beim Laden der Fahrten: ${error.message}`);

  return transformRideRows(data || []);
}

/**
 * Gets a single ride by ID with authorization check for driver.
 */
export async function getDriverRide(
  rideId: string,
  driverId: string
): Promise<RideWithRelations | null> {
  const supabase = await createClient();
  const validRideId = validateId(rideId, 'ride');
  const validDriverId = validateId(driverId, 'driver');

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
    .eq('id', validRideId)
    .eq('driver_id', validDriverId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Fehler beim Laden der Fahrt: ${error.message}`);
  }

  const rides = transformRideRows([data]);
  return rides[0] || null;
}

// =============================================================================
// DRIVER STATUS ACTIONS
// =============================================================================

export interface ActionResult {
  success: boolean;
  message: string;
  ride?: RideWithRelations;
}

/**
 * Driver confirms an assigned ride.
 * Transition: planned -> confirmed
 */
export async function driverConfirmRide(
  rideId: string,
  driverId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const validRideId = validateId(rideId, 'ride');
  const validDriverId = validateId(driverId, 'driver');

  // Verify ride belongs to driver and is in correct status
  const { data: currentRide, error: fetchError } = await supabase
    .from('rides')
    .select('id, status, driver_id')
    .eq('id', validRideId)
    .single();

  if (fetchError || !currentRide) {
    return { success: false, message: 'Fahrt nicht gefunden' };
  }

  if (currentRide.driver_id !== validDriverId) {
    return { success: false, message: 'Diese Fahrt ist dir nicht zugewiesen' };
  }

  if (currentRide.status !== 'planned') {
    return {
      success: false,
      message: `Fahrt kann nicht bestaetigt werden (aktueller Status: ${currentRide.status})`
    };
  }

  // Update status
  const { error: updateError } = await supabase
    .from('rides')
    .update({
      status: 'confirmed',
      substatus: 'waiting'
    })
    .eq('id', validRideId);

  if (updateError) {
    return { success: false, message: `Fehler: ${updateError.message}` };
  }

  // Send SMS notification to patient (non-blocking)
  notifyRideConfirmed(validRideId).catch((err) => {
    console.error('[SMS] Failed to send ride confirmed notification:', err);
  });

  revalidatePaths(validRideId);
  return { success: true, message: 'Fahrt erfolgreich bestaetigt' };
}

/**
 * Driver rejects an assigned ride.
 * Removes driver assignment and sets status back to planned.
 */
export async function driverRejectRide(
  rideId: string,
  driverId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const validRideId = validateId(rideId, 'ride');
  const validDriverId = validateId(driverId, 'driver');

  // Verify ride belongs to driver
  const { data: currentRide, error: fetchError } = await supabase
    .from('rides')
    .select('id, status, driver_id')
    .eq('id', validRideId)
    .single();

  if (fetchError || !currentRide) {
    return { success: false, message: 'Fahrt nicht gefunden' };
  }

  if (currentRide.driver_id !== validDriverId) {
    return { success: false, message: 'Diese Fahrt ist dir nicht zugewiesen' };
  }

  if (currentRide.status !== 'planned' && currentRide.status !== 'confirmed') {
    return {
      success: false,
      message: `Fahrt kann nicht abgelehnt werden (aktueller Status: ${currentRide.status})`
    };
  }

  // Remove driver and reset status
  const { error: updateError } = await supabase
    .from('rides')
    .update({
      driver_id: null,
      status: 'planned',
      substatus: null
    })
    .eq('id', validRideId);

  if (updateError) {
    return { success: false, message: `Fehler: ${updateError.message}` };
  }

  revalidatePaths(validRideId);
  return { success: true, message: 'Fahrt wurde abgelehnt' };
}

/**
 * Driver starts a confirmed ride (leaves for pickup).
 * Transition: confirmed -> in_progress, substatus: waiting -> en_route_pickup
 * Records started_at timestamp.
 */
export async function driverStartRide(
  rideId: string,
  driverId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const validRideId = validateId(rideId, 'ride');
  const validDriverId = validateId(driverId, 'driver');

  // Verify ride belongs to driver and is confirmed
  const { data: currentRide, error: fetchError } = await supabase
    .from('rides')
    .select('id, status, driver_id')
    .eq('id', validRideId)
    .single();

  if (fetchError || !currentRide) {
    return { success: false, message: 'Fahrt nicht gefunden' };
  }

  if (currentRide.driver_id !== validDriverId) {
    return { success: false, message: 'Diese Fahrt ist dir nicht zugewiesen' };
  }

  if (currentRide.status !== 'confirmed') {
    return {
      success: false,
      message: `Fahrt kann nicht gestartet werden (aktueller Status: ${currentRide.status})`
    };
  }

  const now = new Date().toISOString();

  // Update status and record started_at
  const { error: updateError } = await supabase
    .from('rides')
    .update({
      status: 'in_progress',
      substatus: 'en_route_pickup',
      started_at: now
    })
    .eq('id', validRideId);

  if (updateError) {
    return { success: false, message: `Fehler: ${updateError.message}` };
  }

  // Send SMS notification with ETA (non-blocking)
  // Use estimated duration if available, otherwise default to 15 minutes
  const { data: rideData } = await supabase
    .from('rides')
    .select('estimated_duration')
    .eq('id', validRideId)
    .single();

  const etaMinutes = rideData?.estimated_duration || 15;
  notifyRideStarted(validRideId, etaMinutes).catch((err) => {
    console.error('[SMS] Failed to send ride started notification:', err);
  });

  revalidatePaths(validRideId);
  return { success: true, message: 'Fahrt gestartet - auf dem Weg zur Abholung' };
}

/**
 * Driver confirms arrival at pickup location.
 * Transition: substatus en_route_pickup -> at_pickup
 */
export async function driverArrivedAtPickup(
  rideId: string,
  driverId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const validRideId = validateId(rideId, 'ride');
  const validDriverId = validateId(driverId, 'driver');

  const { data: currentRide, error: fetchError } = await supabase
    .from('rides')
    .select('id, status, substatus, driver_id')
    .eq('id', validRideId)
    .single();

  if (fetchError || !currentRide) {
    return { success: false, message: 'Fahrt nicht gefunden' };
  }

  if (currentRide.driver_id !== validDriverId) {
    return { success: false, message: 'Diese Fahrt ist dir nicht zugewiesen' };
  }

  if (currentRide.status !== 'in_progress' || currentRide.substatus !== 'en_route_pickup') {
    return {
      success: false,
      message: 'Fahrt ist nicht im Status "Auf dem Weg zur Abholung"'
    };
  }

  const { error: updateError } = await supabase
    .from('rides')
    .update({ substatus: 'at_pickup' })
    .eq('id', validRideId);

  if (updateError) {
    return { success: false, message: `Fehler: ${updateError.message}` };
  }

  // Send SMS notification to patient (non-blocking)
  notifyDriverArrived(validRideId).catch((err) => {
    console.error('[SMS] Failed to send driver arrived notification:', err);
  });

  revalidatePaths(validRideId);
  return { success: true, message: 'Bei Patient angekommen' };
}

/**
 * Driver confirms patient pickup.
 * Transition: substatus at_pickup -> en_route_destination
 * Records picked_up_at timestamp.
 */
export async function driverPickedUpPatient(
  rideId: string,
  driverId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const validRideId = validateId(rideId, 'ride');
  const validDriverId = validateId(driverId, 'driver');

  const { data: currentRide, error: fetchError } = await supabase
    .from('rides')
    .select('id, status, substatus, driver_id')
    .eq('id', validRideId)
    .single();

  if (fetchError || !currentRide) {
    return { success: false, message: 'Fahrt nicht gefunden' };
  }

  if (currentRide.driver_id !== validDriverId) {
    return { success: false, message: 'Diese Fahrt ist dir nicht zugewiesen' };
  }

  // Allow pickup from either en_route_pickup or at_pickup
  if (currentRide.status !== 'in_progress' ||
      (currentRide.substatus !== 'en_route_pickup' && currentRide.substatus !== 'at_pickup')) {
    return {
      success: false,
      message: 'Fahrt ist nicht im richtigen Status fuer Abholung'
    };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('rides')
    .update({
      substatus: 'en_route_destination',
      picked_up_at: now
    })
    .eq('id', validRideId);

  if (updateError) {
    return { success: false, message: `Fehler: ${updateError.message}` };
  }

  // Send SMS notification to destination with ETA (non-blocking)
  const { data: rideData } = await supabase
    .from('rides')
    .select('estimated_duration')
    .eq('id', validRideId)
    .single();

  const etaMinutes = rideData?.estimated_duration || 15;
  notifyPatientPickedUp(validRideId, etaMinutes).catch((err) => {
    console.error('[SMS] Failed to send patient picked up notification:', err);
  });

  revalidatePaths(validRideId);
  return { success: true, message: 'Patient abgeholt - auf dem Weg zum Ziel' };
}

/**
 * Driver confirms arrival at destination.
 * Transition: substatus en_route_destination -> at_destination
 * Records arrived_at timestamp.
 */
export async function driverArrivedAtDestination(
  rideId: string,
  driverId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const validRideId = validateId(rideId, 'ride');
  const validDriverId = validateId(driverId, 'driver');

  const { data: currentRide, error: fetchError } = await supabase
    .from('rides')
    .select('id, status, substatus, driver_id')
    .eq('id', validRideId)
    .single();

  if (fetchError || !currentRide) {
    return { success: false, message: 'Fahrt nicht gefunden' };
  }

  if (currentRide.driver_id !== validDriverId) {
    return { success: false, message: 'Diese Fahrt ist dir nicht zugewiesen' };
  }

  if (currentRide.status !== 'in_progress' || currentRide.substatus !== 'en_route_destination') {
    return {
      success: false,
      message: 'Fahrt ist nicht im Status "Auf dem Weg zum Ziel"'
    };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('rides')
    .update({
      substatus: 'at_destination',
      arrived_at: now
    })
    .eq('id', validRideId);

  if (updateError) {
    return { success: false, message: `Fehler: ${updateError.message}` };
  }

  revalidatePaths(validRideId);
  return { success: true, message: 'Am Ziel angekommen' };
}

/**
 * Driver completes a ride.
 * Transition: in_progress -> completed, substatus: any -> completed
 * Records completed_at timestamp.
 */
export async function driverCompleteRide(
  rideId: string,
  driverId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const validRideId = validateId(rideId, 'ride');
  const validDriverId = validateId(driverId, 'driver');

  // Verify ride belongs to driver and is in progress
  const { data: currentRide, error: fetchError } = await supabase
    .from('rides')
    .select('id, status, substatus, driver_id, picked_up_at, arrived_at')
    .eq('id', validRideId)
    .single();

  if (fetchError || !currentRide) {
    return { success: false, message: 'Fahrt nicht gefunden' };
  }

  if (currentRide.driver_id !== validDriverId) {
    return { success: false, message: 'Diese Fahrt ist dir nicht zugewiesen' };
  }

  if (currentRide.status !== 'in_progress') {
    return {
      success: false,
      message: `Fahrt kann nicht abgeschlossen werden (aktueller Status: ${currentRide.status})`
    };
  }

  const now = new Date().toISOString();

  // Build update object, filling in missing intermediate timestamps if needed
  const updateData: Record<string, unknown> = {
    status: 'completed',
    substatus: 'completed',
    completed_at: now
  };

  // If arrived_at is missing, set it to now (in case driver skipped intermediate steps)
  if (!currentRide.arrived_at) {
    updateData.arrived_at = now;
  }

  // If picked_up_at is missing, set it to now (edge case handling)
  if (!currentRide.picked_up_at) {
    updateData.picked_up_at = now;
  }

  const { error: updateError } = await supabase
    .from('rides')
    .update(updateData)
    .eq('id', validRideId);

  if (updateError) {
    return { success: false, message: `Fehler: ${updateError.message}` };
  }

  // Send SMS notification to patient (non-blocking)
  notifyRideCompleted(validRideId).catch((err) => {
    console.error('[SMS] Failed to send ride completed notification:', err);
  });

  revalidatePaths(validRideId);
  return { success: true, message: 'Fahrt erfolgreich abgeschlossen' };
}

/**
 * Quick complete action for simple rides.
 * Skips intermediate steps and goes directly to completed.
 * Records all timestamps at once.
 */
export async function driverQuickCompleteRide(
  rideId: string,
  driverId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const validRideId = validateId(rideId, 'ride');
  const validDriverId = validateId(driverId, 'driver');

  const { data: currentRide, error: fetchError } = await supabase
    .from('rides')
    .select('id, status, driver_id, started_at')
    .eq('id', validRideId)
    .single();

  if (fetchError || !currentRide) {
    return { success: false, message: 'Fahrt nicht gefunden' };
  }

  if (currentRide.driver_id !== validDriverId) {
    return { success: false, message: 'Diese Fahrt ist dir nicht zugewiesen' };
  }

  // Allow quick complete from confirmed or in_progress
  if (currentRide.status !== 'confirmed' && currentRide.status !== 'in_progress') {
    return {
      success: false,
      message: `Fahrt kann nicht abgeschlossen werden (aktueller Status: ${currentRide.status})`
    };
  }

  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    status: 'completed',
    substatus: 'completed',
    completed_at: now
  };

  // Set all intermediate timestamps if not already set
  if (!currentRide.started_at) {
    updateData.started_at = now;
  }
  updateData.picked_up_at = now;
  updateData.arrived_at = now;

  const { error: updateError } = await supabase
    .from('rides')
    .update(updateData)
    .eq('id', validRideId);

  if (updateError) {
    return { success: false, message: `Fehler: ${updateError.message}` };
  }

  // Send SMS notification to patient (non-blocking)
  notifyRideCompleted(validRideId).catch((err) => {
    console.error('[SMS] Failed to send ride completed notification:', err);
  });

  revalidatePaths(validRideId);
  return { success: true, message: 'Fahrt erfolgreich abgeschlossen' };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Revalidate all paths that could be affected by ride changes.
 */
function revalidatePaths(rideId: string): void {
  revalidatePath('/my-rides');
  revalidatePath(`/my-rides/${rideId}`);
  revalidatePath('/rides');
  revalidatePath('/dashboard');
}

/**
 * Transform raw database rows to typed RideWithRelations objects.
 */
function transformRideRows(data: Record<string, unknown>[]): RideWithRelations[] {
  return data.map((row) => {
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
        pickupInstructions: (patient.pickup_instructions as string) || null,
        notes: (patient.notes as string) || null,
        latitude: (patient.latitude as number) || null,
        longitude: (patient.longitude as number) || null,
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
        phone: (destination.phone as string) || null,
        arrivalInstructions: (destination.arrival_instructions as string) || null,
        latitude: (destination.latitude as number) || null,
        longitude: (destination.longitude as number) || null,
      },
    };
  });
}

// =============================================================================
// EXTENDED TYPES FOR DRIVER VIEW
// =============================================================================

export interface DriverRidePatient {
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
  pickupInstructions: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface DriverRideDestination {
  id: string;
  name: string;
  street: string;
  postalCode: string;
  city: string;
  phone: string | null;
  arrivalInstructions: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface DriverRide {
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
  // Execution timestamps
  startedAt: string | null;
  pickedUpAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  patient: DriverRidePatient;
  destination: DriverRideDestination;
}
