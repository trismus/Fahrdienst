'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { validateId } from '@/lib/utils/sanitize';
import { notifyDriverOfRideAssignment } from '@/lib/notifications';

// =============================================================================
// TYPES
// =============================================================================

export interface AssignDriverResult {
  success: boolean;
  message: string;
  notificationSent: boolean;
}

// =============================================================================
// ASSIGN DRIVER WITH NOTIFICATION
// =============================================================================

/**
 * Assigns a driver to a ride and sends an email notification.
 *
 * This is the primary function for dispatcher use when assigning drivers.
 * It handles:
 * 1. Validating the ride and driver exist
 * 2. Updating the ride with the driver assignment
 * 3. Sending an email notification to the driver
 * 4. Revalidating affected paths
 */
export async function assignDriverWithNotification(
  rideId: string,
  driverId: string
): Promise<AssignDriverResult> {
  const supabase = await createClient();

  // Validate IDs
  const validRideId = validateId(rideId, 'ride');
  const validDriverId = validateId(driverId, 'driver');

  // Get ride with patient and destination details
  const { data: ride, error: rideError } = await supabase
    .from('rides')
    .select(`
      id,
      pickup_time,
      status,
      patient:patients!inner(
        id, first_name, last_name, street, postal_code, city
      ),
      destination:destinations!inner(
        id, name
      )
    `)
    .eq('id', validRideId)
    .single();

  if (rideError || !ride) {
    return {
      success: false,
      message: 'Fahrt nicht gefunden',
      notificationSent: false,
    };
  }

  // Check ride is in assignable state
  if (ride.status !== 'planned') {
    return {
      success: false,
      message: `Fahrt kann nicht zugewiesen werden (Status: ${ride.status})`,
      notificationSent: false,
    };
  }

  // Get driver details
  const { data: driver, error: driverError } = await supabase
    .from('drivers')
    .select('id, first_name, last_name, email, is_active')
    .eq('id', validDriverId)
    .single();

  if (driverError || !driver) {
    return {
      success: false,
      message: 'Fahrer nicht gefunden',
      notificationSent: false,
    };
  }

  if (!driver.is_active) {
    return {
      success: false,
      message: 'Fahrer ist nicht aktiv',
      notificationSent: false,
    };
  }

  // Update ride with driver assignment
  const { error: updateError } = await supabase
    .from('rides')
    .update({ driver_id: validDriverId })
    .eq('id', validRideId);

  if (updateError) {
    return {
      success: false,
      message: `Fehler bei der Zuweisung: ${updateError.message}`,
      notificationSent: false,
    };
  }

  // Send notification (fire and forget - don't fail if notification fails)
  let notificationSent = false;
  if (driver.email) {
    try {
      // Supabase returns patient and destination as objects when using .single()
      // Cast through unknown to satisfy TypeScript
      const patient = ride.patient as unknown as {
        first_name: string;
        last_name: string;
        street: string;
        postal_code: string;
        city: string;
      };
      const destination = ride.destination as unknown as { name: string };

      const pickupAddress = [
        patient.street,
        `${patient.postal_code} ${patient.city}`.trim(),
      ].filter(Boolean).join(', ');

      const result = await notifyDriverOfRideAssignment({
        driverEmail: driver.email,
        driverName: `${driver.first_name} ${driver.last_name}`,
        patientName: `${patient.first_name} ${patient.last_name}`,
        destinationName: destination.name,
        pickupTime: ride.pickup_time,
        pickupAddress,
        rideId: validRideId,
      });

      notificationSent = result.success;
    } catch (error) {
      console.error('Failed to send assignment notification:', error);
      // Don't fail the assignment if notification fails
    }
  }

  // Revalidate paths
  revalidatePath('/rides');
  revalidatePath(`/rides/${validRideId}`);
  revalidatePath('/dashboard');
  revalidatePath('/my-rides');

  return {
    success: true,
    message: notificationSent
      ? 'Fahrer zugewiesen und benachrichtigt'
      : 'Fahrer zugewiesen (keine Benachrichtigung gesendet)',
    notificationSent,
  };
}

/**
 * Unassigns a driver from a ride.
 */
export async function unassignDriverFromRide(rideId: string): Promise<AssignDriverResult> {
  const supabase = await createClient();
  const validRideId = validateId(rideId, 'ride');

  // Get current ride state
  const { data: ride, error: fetchError } = await supabase
    .from('rides')
    .select('id, status, driver_id')
    .eq('id', validRideId)
    .single();

  if (fetchError || !ride) {
    return {
      success: false,
      message: 'Fahrt nicht gefunden',
      notificationSent: false,
    };
  }

  if (!ride.driver_id) {
    return {
      success: false,
      message: 'Fahrt hat keinen zugewiesenen Fahrer',
      notificationSent: false,
    };
  }

  // Can only unassign if ride is planned or confirmed
  if (ride.status !== 'planned' && ride.status !== 'confirmed') {
    return {
      success: false,
      message: `Fahrer kann nicht entfernt werden (Status: ${ride.status})`,
      notificationSent: false,
    };
  }

  // Remove driver and reset status
  const { error: updateError } = await supabase
    .from('rides')
    .update({
      driver_id: null,
      status: 'planned',
    })
    .eq('id', validRideId);

  if (updateError) {
    return {
      success: false,
      message: `Fehler beim Entfernen: ${updateError.message}`,
      notificationSent: false,
    };
  }

  // Revalidate paths
  revalidatePath('/rides');
  revalidatePath(`/rides/${validRideId}`);
  revalidatePath('/dashboard');
  revalidatePath('/my-rides');

  return {
    success: true,
    message: 'Fahrer von Fahrt entfernt',
    notificationSent: false,
  };
}
