'use server';

/**
 * Email Notification Service - STUB IMPLEMENTATION
 *
 * This is a placeholder implementation that logs notifications instead of
 * sending actual emails. Replace with a real email provider (Resend, SendGrid,
 * Mailgun, etc.) when ready for production.
 *
 * TODO: Implement actual email sending
 * - [ ] Choose email provider (Resend recommended for Next.js)
 * - [ ] Add API keys to environment variables
 * - [ ] Create email templates
 * - [ ] Add error handling and retry logic
 */

// =============================================================================
// TYPES
// =============================================================================

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface RideAssignmentNotificationData {
  driverEmail: string;
  driverName: string;
  patientName: string;
  destinationName: string;
  pickupTime: string;
  pickupAddress: string;
  rideId: string;
}

export interface RideRejectionNotificationData {
  dispatcherEmail: string;
  driverName: string;
  patientName: string;
  pickupTime: string;
  rideId: string;
}

export interface NotificationResult {
  success: boolean;
  message: string;
  notificationId?: string;
}

// =============================================================================
// STUB IMPLEMENTATION
// =============================================================================

/**
 * Sends an email notification.
 * STUB: Logs to console instead of sending actual email.
 */
async function sendEmail(notification: EmailNotification): Promise<NotificationResult> {
  // Log the notification for debugging
  console.log('='.repeat(60));
  console.log('[EMAIL STUB] Would send email:');
  console.log(`  To: ${notification.to}`);
  console.log(`  Subject: ${notification.subject}`);
  console.log(`  Body: ${notification.body.substring(0, 200)}...`);
  if (notification.metadata) {
    console.log(`  Metadata: ${JSON.stringify(notification.metadata)}`);
  }
  console.log('='.repeat(60));

  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Return success (stub always succeeds)
  return {
    success: true,
    message: '[STUB] Email logged to console',
    notificationId: `stub-${Date.now()}`,
  };
}

// =============================================================================
// NOTIFICATION FUNCTIONS
// =============================================================================

/**
 * Sends a notification to a driver when they are assigned a new ride.
 */
export async function notifyDriverOfRideAssignment(
  data: RideAssignmentNotificationData
): Promise<NotificationResult> {
  const pickupDate = new Date(data.pickupTime);
  const formattedDate = pickupDate.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = pickupDate.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Neue Fahrt zugewiesen: ${data.patientName} am ${formattedDate}`;

  const body = `
Hallo ${data.driverName},

Dir wurde eine neue Fahrt zugewiesen:

Patient: ${data.patientName}
Ziel: ${data.destinationName}
Abholzeit: ${formattedDate} um ${formattedTime}
Abholadresse: ${data.pickupAddress}

Bitte bestaetigen oder lehne die Fahrt in der App ab:
[Link zur App]

Mit freundlichen Gruessen,
Dein Fahrdienst-Team
`.trim();

  return sendEmail({
    to: data.driverEmail,
    subject,
    body,
    metadata: {
      type: 'ride_assignment',
      rideId: data.rideId,
      driverEmail: data.driverEmail,
    },
  });
}

/**
 * Sends a notification to the dispatcher when a driver rejects a ride.
 * This function is a placeholder for future implementation.
 */
export async function notifyDispatcherOfRideRejection(
  data: RideRejectionNotificationData
): Promise<NotificationResult> {
  const pickupDate = new Date(data.pickupTime);
  const formattedDate = pickupDate.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = pickupDate.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Fahrt abgelehnt: ${data.patientName} am ${formattedDate}`;

  const body = `
Eine Fahrt wurde abgelehnt und erfordert eine Neuzuweisung:

Fahrer: ${data.driverName}
Patient: ${data.patientName}
Geplante Abholzeit: ${formattedDate} um ${formattedTime}

Bitte weise die Fahrt einem anderen Fahrer zu:
[Link zur Fahrt]

Mit freundlichen Gruessen,
Fahrdienst-System
`.trim();

  return sendEmail({
    to: data.dispatcherEmail,
    subject,
    body,
    metadata: {
      type: 'ride_rejection',
      rideId: data.rideId,
      dispatcherEmail: data.dispatcherEmail,
    },
  });
}

/**
 * Sends a confirmation email to a driver when they confirm a ride.
 */
export async function notifyDriverOfRideConfirmation(
  driverEmail: string,
  driverName: string,
  patientName: string,
  pickupTime: string,
  destinationName: string
): Promise<NotificationResult> {
  const pickupDate = new Date(pickupTime);
  const formattedDate = pickupDate.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = pickupDate.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Fahrt bestaetigt: ${patientName} am ${formattedDate}`;

  const body = `
Hallo ${driverName},

Du hast folgende Fahrt bestaetigt:

Patient: ${patientName}
Ziel: ${destinationName}
Abholzeit: ${formattedDate} um ${formattedTime}

Wir freuen uns auf dich!

Mit freundlichen Gruessen,
Dein Fahrdienst-Team
`.trim();

  return sendEmail({
    to: driverEmail,
    subject,
    body,
    metadata: {
      type: 'ride_confirmation',
      driverEmail,
    },
  });
}

// =============================================================================
// FUTURE IMPLEMENTATION NOTES
// =============================================================================

/**
 * Example implementation with Resend:
 *
 * import { Resend } from 'resend';
 *
 * const resend = new Resend(process.env.RESEND_API_KEY);
 *
 * async function sendEmail(notification: EmailNotification): Promise<NotificationResult> {
 *   try {
 *     const { data, error } = await resend.emails.send({
 *       from: 'Fahrdienst <noreply@fahrdienst.ch>',
 *       to: notification.to,
 *       subject: notification.subject,
 *       text: notification.body,
 *       // html: notification.htmlBody, // if using templates
 *     });
 *
 *     if (error) {
 *       console.error('Email send error:', error);
 *       return { success: false, message: error.message };
 *     }
 *
 *     return {
 *       success: true,
 *       message: 'Email sent successfully',
 *       notificationId: data?.id,
 *     };
 *   } catch (error) {
 *     console.error('Email send exception:', error);
 *     return {
 *       success: false,
 *       message: error instanceof Error ? error.message : 'Unknown error',
 *     };
 *   }
 * }
 */
