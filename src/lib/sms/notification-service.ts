'use server';

/**
 * SMS Notification Service for Fahrdienst
 *
 * High-level service for sending ride-related notifications.
 * Handles recipient selection, message templating, and delivery.
 */

import { createClient } from '@/lib/supabase/server';
import { maskPhoneNumber } from '@/lib/utils/mask-phone';
import {
  type NotificationType,
  type NotificationContext,
  type RideNotificationData,
  type RecipientType,
  type SmsMessage,
  DEFAULT_RECIPIENT_MAPPING,
} from './types';
import { getNotificationMessage, hasTemplate } from './templates';
import { sendSms, isValidPhoneNumber } from './twilio-client';

// =============================================================================
// TYPES
// =============================================================================

interface NotificationResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors: string[];
}

interface RideWithDetails {
  id: string;
  pickup_time: string;
  arrival_time: string;
  notes: string | null;
  estimated_duration: number | null;
  estimated_distance: number | null;
  patient: {
    first_name: string;
    last_name: string;
    phone: string;
    street: string;
    city: string;
    postal_code: string;
  };
  destination: {
    name: string;
    street: string;
    city: string;
    postal_code: string;
    phone: string | null;
  };
  driver: {
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Transform ride data from database to notification format.
 */
function transformRideData(ride: RideWithDetails): RideNotificationData {
  return {
    rideId: ride.id,
    pickupTime: ride.pickup_time,
    arrivalTime: ride.arrival_time,
    patientName: `${ride.patient.first_name} ${ride.patient.last_name}`,
    patientPhone: ride.patient.phone,
    patientAddress: `${ride.patient.street}, ${ride.patient.postal_code} ${ride.patient.city}`,
    destinationName: ride.destination.name,
    destinationAddress: `${ride.destination.street}, ${ride.destination.postal_code} ${ride.destination.city}`,
    destinationPhone: ride.destination.phone || undefined,
    driverName: ride.driver ? `${ride.driver.first_name} ${ride.driver.last_name}` : undefined,
    driverPhone: ride.driver?.phone,
    estimatedDuration: ride.estimated_duration || undefined,
    estimatedDistance: ride.estimated_distance || undefined,
    notes: ride.notes || undefined,
  };
}

/**
 * Get phone number for a recipient type.
 */
function getRecipientPhone(ride: RideWithDetails, recipientType: RecipientType): string | null {
  switch (recipientType) {
    case 'patient':
      return ride.patient.phone;
    case 'driver':
      return ride.driver?.phone || null;
    case 'destination':
      return ride.destination.phone;
    case 'dispatcher':
      // Dispatcher notification could be handled differently (email, push, etc.)
      return null;
    default:
      return null;
  }
}

/**
 * Load ride with all required relations.
 */
async function loadRide(rideId: string): Promise<RideWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('rides')
    .select(`
      id,
      pickup_time,
      arrival_time,
      notes,
      estimated_duration,
      estimated_distance,
      patient:patients!inner(first_name, last_name, phone, street, city, postal_code),
      destination:destinations!inner(name, street, city, postal_code, phone),
      driver:drivers(first_name, last_name, phone)
    `)
    .eq('id', rideId)
    .single();

  if (error || !data) {
    console.error('[SMS] Failed to load ride:', error?.message);
    return null;
  }

  return data as unknown as RideWithDetails;
}

/**
 * Log notification to database for audit.
 */
async function logNotification(
  rideId: string,
  notificationType: NotificationType,
  recipientType: RecipientType,
  recipientPhone: string,
  messageBody: string,
  success: boolean,
  messageId?: string,
  errorMessage?: string
): Promise<void> {
  // Note: This requires a notification_logs table to be created
  // For now, we just log to console with GDPR-compliant phone masking
  console.log('[SMS] Notification log:', {
    rideId,
    notificationType,
    recipientType,
    recipientPhone: maskPhoneNumber(recipientPhone), // GDPR-compliant masking
    success,
    messageId: success ? messageId : undefined,
    errorMessage: errorMessage ? errorMessage.substring(0, 100) : undefined, // Truncate error messages
    timestamp: new Date().toISOString(),
  });

  // TODO: Insert into notification_logs table when schema is added
  // await supabase.from('notification_logs').insert({
  //   ride_id: rideId,
  //   notification_type: notificationType,
  //   recipient_type: recipientType,
  //   recipient_phone: recipientPhone,
  //   message_body: messageBody,
  //   status: success ? 'sent' : 'failed',
  //   message_id: messageId,
  //   error_message: errorMessage,
  // });
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Send notifications for a ride event.
 *
 * @param rideId - The ride to notify about
 * @param notificationType - Type of notification event
 * @param additionalContext - Optional additional context (eta, cancellation reason, etc.)
 */
export async function sendRideNotification(
  rideId: string,
  notificationType: NotificationType,
  additionalContext?: Partial<Pick<NotificationContext, 'eta' | 'cancellationReason' | 'reminderMinutes'>>
): Promise<NotificationResult> {
  const result: NotificationResult = {
    success: true,
    sentCount: 0,
    failedCount: 0,
    errors: [],
  };

  // Load ride data
  const ride = await loadRide(rideId);
  if (!ride) {
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      errors: ['Ride not found'],
    };
  }

  // Get recipients for this notification type
  const recipients = DEFAULT_RECIPIENT_MAPPING[notificationType] || [];

  // Build notification context
  const context: NotificationContext = {
    type: notificationType,
    ride: transformRideData(ride),
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };

  // Send to each recipient
  for (const recipientType of recipients) {
    const phone = getRecipientPhone(ride, recipientType);

    if (!phone) {
      console.log(`[SMS] No phone number for ${recipientType}, skipping`);
      continue;
    }

    if (!isValidPhoneNumber(phone)) {
      console.warn(`[SMS] Invalid phone number for ${recipientType}: ${phone}`);
      result.errors.push(`Invalid phone for ${recipientType}`);
      result.failedCount++;
      continue;
    }

    if (!hasTemplate(notificationType, recipientType)) {
      console.log(`[SMS] No template for ${notificationType} -> ${recipientType}, skipping`);
      continue;
    }

    const messageBody = getNotificationMessage(notificationType, recipientType, context);
    if (!messageBody) {
      continue;
    }

    const smsMessage: SmsMessage = {
      to: phone,
      body: messageBody,
      recipientType,
      notificationType,
      rideId,
    };

    const sendResult = await sendSms(smsMessage);

    // Log the notification
    await logNotification(
      rideId,
      notificationType,
      recipientType,
      phone,
      messageBody,
      sendResult.success,
      sendResult.messageId,
      sendResult.error
    );

    if (sendResult.success) {
      result.sentCount++;
    } else {
      result.failedCount++;
      result.errors.push(`${recipientType}: ${sendResult.error}`);
    }
  }

  result.success = result.failedCount === 0;
  return result;
}

/**
 * Send ride assigned notification.
 */
export async function notifyRideAssigned(rideId: string): Promise<NotificationResult> {
  return sendRideNotification(rideId, 'ride_assigned');
}

/**
 * Send ride confirmed notification.
 */
export async function notifyRideConfirmed(rideId: string): Promise<NotificationResult> {
  return sendRideNotification(rideId, 'ride_confirmed');
}

/**
 * Send ride started notification with ETA.
 */
export async function notifyRideStarted(rideId: string, etaMinutes?: number): Promise<NotificationResult> {
  const eta = etaMinutes
    ? new Date(Date.now() + etaMinutes * 60000).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
    : undefined;

  return sendRideNotification(rideId, 'ride_started', { eta });
}

/**
 * Send driver arrived notification.
 */
export async function notifyDriverArrived(rideId: string): Promise<NotificationResult> {
  return sendRideNotification(rideId, 'driver_arrived');
}

/**
 * Send patient picked up notification with ETA to destination.
 */
export async function notifyPatientPickedUp(rideId: string, etaMinutes?: number): Promise<NotificationResult> {
  const eta = etaMinutes
    ? new Date(Date.now() + etaMinutes * 60000).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
    : undefined;

  return sendRideNotification(rideId, 'patient_picked_up', { eta });
}

/**
 * Send ride completed notification.
 */
export async function notifyRideCompleted(rideId: string): Promise<NotificationResult> {
  return sendRideNotification(rideId, 'ride_completed');
}

/**
 * Send ride cancelled notification.
 */
export async function notifyRideCancelled(rideId: string, reason?: string): Promise<NotificationResult> {
  return sendRideNotification(rideId, 'ride_cancelled', { cancellationReason: reason });
}

/**
 * Send ride reminder notification.
 */
export async function notifyRideReminder(rideId: string, minutesBefore: number): Promise<NotificationResult> {
  return sendRideNotification(rideId, 'ride_reminder', { reminderMinutes: minutesBefore });
}
