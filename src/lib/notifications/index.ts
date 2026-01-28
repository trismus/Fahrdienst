/**
 * Notification Service
 *
 * Provides email and (future) SMS notifications for the Fahrdienst application.
 * Currently implements email notifications as stubs that log to console.
 */

export {
  notifyDriverOfRideAssignment,
  notifyDispatcherOfRideRejection,
  notifyDriverOfRideConfirmation,
  type EmailNotification,
  type RideAssignmentNotificationData,
  type RideRejectionNotificationData,
  type NotificationResult,
} from './email';
