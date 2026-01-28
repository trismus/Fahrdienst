/**
 * SMS Module for Fahrdienst
 *
 * Provides SMS notification capabilities for ride lifecycle events.
 *
 * Usage:
 * ```typescript
 * import { notifyRideStarted, notifyRideCompleted } from '@/lib/sms';
 *
 * // Send notification when driver starts ride
 * await notifyRideStarted(rideId, estimatedMinutes);
 *
 * // Send notification when ride is completed
 * await notifyRideCompleted(rideId);
 * ```
 *
 * Configuration (environment variables):
 * - TWILIO_ACCOUNT_SID: Twilio account SID
 * - TWILIO_AUTH_TOKEN: Twilio auth token
 * - TWILIO_FROM_NUMBER: Twilio phone number to send from
 * - SMS_ENABLED: Set to 'true' to enable SMS sending
 */

// Re-export types
export type {
  NotificationType,
  RecipientType,
  RideNotificationData,
  NotificationContext,
  SmsMessage,
  SmsSendResult,
  NotificationLog,
  SmsConfig,
} from './types';

// Re-export notification functions
export {
  sendRideNotification,
  notifyRideAssigned,
  notifyRideConfirmed,
  notifyRideStarted,
  notifyDriverArrived,
  notifyPatientPickedUp,
  notifyRideCompleted,
  notifyRideCancelled,
  notifyRideReminder,
} from './notification-service';

// Re-export utility functions
export {
  sendSms,
  isSmsConfigured,
  isSmsEnabled,
  formatPhoneNumber,
  isValidPhoneNumber,
} from './twilio-client';

// Re-export template functions
export {
  getNotificationMessage,
  getAvailableTemplates,
  hasTemplate,
} from './templates';
