/**
 * SMS Notification Types for Fahrdienst
 *
 * Defines the structure for SMS notifications sent during ride lifecycle events.
 */

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

/**
 * Types of SMS notifications that can be sent.
 */
export type NotificationType =
  | 'ride_assigned'       // Driver assigned to ride
  | 'ride_confirmed'      // Driver confirmed ride
  | 'ride_started'        // Driver started ride (ETA notification)
  | 'driver_arrived'      // Driver arrived at pickup location
  | 'patient_picked_up'   // Patient has been picked up
  | 'ride_completed'      // Ride completed
  | 'ride_cancelled'      // Ride cancelled
  | 'ride_reminder';      // Reminder before pickup time

/**
 * Recipient types for notifications.
 */
export type RecipientType = 'patient' | 'driver' | 'dispatcher' | 'destination';

// =============================================================================
// NOTIFICATION DATA
// =============================================================================

/**
 * Common ride data used in notifications.
 */
export interface RideNotificationData {
  rideId: string;
  pickupTime: string;
  arrivalTime: string;
  patientName: string;
  patientPhone: string;
  patientAddress: string;
  destinationName: string;
  destinationAddress: string;
  destinationPhone?: string;
  driverName?: string;
  driverPhone?: string;
  estimatedDuration?: number;
  estimatedDistance?: number;
  notes?: string;
}

/**
 * Additional data for specific notification types.
 */
export interface NotificationContext {
  type: NotificationType;
  ride: RideNotificationData;
  timestamp: string;
  // Type-specific data
  eta?: string;             // Estimated time of arrival
  cancellationReason?: string;
  reminderMinutes?: number; // Minutes before pickup for reminder
}

// =============================================================================
// SMS MESSAGE STRUCTURE
// =============================================================================

/**
 * Structure of an SMS message to be sent.
 */
export interface SmsMessage {
  to: string;           // Phone number in E.164 format
  body: string;         // Message content
  recipientType: RecipientType;
  notificationType: NotificationType;
  rideId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result of sending an SMS.
 */
export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
  timestamp: string;
}

// =============================================================================
// NOTIFICATION LOG
// =============================================================================

/**
 * Record of a sent notification for audit purposes.
 */
export interface NotificationLog {
  id: string;
  rideId: string;
  notificationType: NotificationType;
  recipientType: RecipientType;
  recipientPhone: string;
  messageBody: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  messageId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * SMS service configuration.
 */
export interface SmsConfig {
  provider: 'twilio' | 'messagebird' | 'mock';
  enabled: boolean;
  fromNumber: string;
  // Rate limiting
  maxMessagesPerMinute: number;
  maxMessagesPerHour: number;
  // Notification preferences
  enabledNotifications: NotificationType[];
  // Recipients to notify for each notification type
  recipientMapping: Record<NotificationType, RecipientType[]>;
}

/**
 * Default recipient mapping for notifications.
 */
export const DEFAULT_RECIPIENT_MAPPING: Record<NotificationType, RecipientType[]> = {
  ride_assigned: ['driver'],
  ride_confirmed: ['patient'],
  ride_started: ['patient'],
  driver_arrived: ['patient'],
  patient_picked_up: ['destination'],
  ride_completed: ['patient'],
  ride_cancelled: ['patient', 'driver'],
  ride_reminder: ['patient', 'driver'],
};
