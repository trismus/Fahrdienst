'use server';

import { Resend } from 'resend';

/**
 * Email Notification Service
 *
 * Sends email notifications using Resend API.
 * Falls back to console logging in development or when RESEND_API_KEY is not set.
 *
 * Required environment variables:
 * - RESEND_API_KEY: Your Resend API key
 * - EMAIL_FROM: Sender address (e.g., 'Fahrdienst <noreply@fahrdienst.ch>')
 * - NEXT_PUBLIC_APP_URL: Base URL for links in emails
 */

// =============================================================================
// TYPES
// =============================================================================

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  html?: string;
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
// CONFIGURATION
// =============================================================================

/**
 * Check if email sending is enabled
 */
function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY && process.env.EMAIL_ENABLED === 'true';
}

/**
 * Get the sender address
 */
function getFromAddress(): string {
  return process.env.EMAIL_FROM || 'Fahrdienst <noreply@fahrdienst.ch>';
}

/**
 * Get the app URL for links
 */
function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

// =============================================================================
// EMAIL SENDING
// =============================================================================

/**
 * Sends an email notification using Resend
 */
async function sendEmail(notification: EmailNotification): Promise<NotificationResult> {
  // If email is disabled, log to console and return success
  if (!isEmailEnabled()) {
    console.log('='.repeat(60));
    console.log('[EMAIL] Email sending disabled or RESEND_API_KEY not set');
    console.log(`  To: ${notification.to}`);
    console.log(`  Subject: ${notification.subject}`);
    console.log(`  Body: ${notification.body.substring(0, 200)}...`);
    if (notification.metadata) {
      console.log(`  Metadata: ${JSON.stringify(notification.metadata)}`);
    }
    console.log('='.repeat(60));

    return {
      success: true,
      message: 'Email logged to console (sending disabled)',
      notificationId: `console-${Date.now()}`,
    };
  }

  // Initialize Resend client
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: notification.to,
      subject: notification.subject,
      text: notification.body,
      html: notification.html,
    });

    if (error) {
      console.error('[EMAIL] Resend error:', error);
      return {
        success: false,
        message: error.message || 'Email sending failed',
      };
    }

    console.log('[EMAIL] Email sent successfully:', data?.id);

    return {
      success: true,
      message: 'Email sent successfully',
      notificationId: data?.id,
    };
  } catch (error) {
    console.error('[EMAIL] Exception:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// HTML TEMPLATE HELPERS
// =============================================================================

/**
 * Escapes HTML special characters to prevent XSS/injection attacks
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Creates a simple HTML email template
 */
function createHtmlTemplate(content: {
  heading: string;
  body: string;
  buttonText?: string;
  buttonUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(content.heading)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      padding: 32px;
    }
    .logo {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: bold;
      color: #000;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      color: #000;
      margin: 0 0 24px 0;
    }
    p {
      margin: 0 0 16px 0;
      color: #4a4a4a;
    }
    .info-block {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      margin-bottom: 8px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      font-weight: 600;
      color: #666;
      min-width: 120px;
    }
    .info-value {
      color: #000;
    }
    .button {
      display: inline-block;
      background-color: #000;
      color: #fff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
    }
    .button:hover {
      background-color: #333;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #eee;
      font-size: 14px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">Fahrdienst</span>
      </div>
      <h1>${escapeHtml(content.heading)}</h1>
      ${content.body}
      ${content.buttonText && content.buttonUrl ? `
        <div style="text-align: center;">
          <a href="${escapeHtml(content.buttonUrl)}" class="button">${escapeHtml(content.buttonText)}</a>
        </div>
      ` : ''}
      <div class="footer">
        <p>Mit freundlichen Gruessen,<br>Ihr Fahrdienst-Team</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Formats date in German format
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formats time in German format
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });
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
  const formattedDate = formatDate(data.pickupTime);
  const formattedTime = formatTime(data.pickupTime);
  const appUrl = getAppUrl();

  const subject = `Neue Fahrt zugewiesen: ${data.patientName} am ${formattedDate}`;

  const body = `
Hallo ${data.driverName},

Dir wurde eine neue Fahrt zugewiesen:

Patient: ${data.patientName}
Ziel: ${data.destinationName}
Abholzeit: ${formattedDate} um ${formattedTime}
Abholadresse: ${data.pickupAddress}

Bitte bestaetigen oder lehne die Fahrt in der App ab:
${appUrl}/my-rides

Mit freundlichen Gruessen,
Dein Fahrdienst-Team
`.trim();

  const html = createHtmlTemplate({
    heading: 'Neue Fahrt zugewiesen',
    body: `
      <p>Hallo ${escapeHtml(data.driverName)},</p>
      <p>Dir wurde eine neue Fahrt zugewiesen:</p>
      <div class="info-block">
        <div class="info-row">
          <span class="info-label">Patient:</span>
          <span class="info-value">${escapeHtml(data.patientName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ziel:</span>
          <span class="info-value">${escapeHtml(data.destinationName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Abholzeit:</span>
          <span class="info-value">${escapeHtml(formattedDate)} um ${escapeHtml(formattedTime)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Abholadresse:</span>
          <span class="info-value">${escapeHtml(data.pickupAddress)}</span>
        </div>
      </div>
      <p>Bitte bestaetigen oder lehne die Fahrt in der App ab.</p>
    `,
    buttonText: 'Fahrt ansehen',
    buttonUrl: `${appUrl}/my-rides`,
  });

  return sendEmail({
    to: data.driverEmail,
    subject,
    body,
    html,
    metadata: {
      type: 'ride_assignment',
      rideId: data.rideId,
      driverEmail: data.driverEmail,
    },
  });
}

/**
 * Sends a notification to the dispatcher when a driver rejects a ride.
 */
export async function notifyDispatcherOfRideRejection(
  data: RideRejectionNotificationData
): Promise<NotificationResult> {
  const formattedDate = formatDate(data.pickupTime);
  const formattedTime = formatTime(data.pickupTime);
  const appUrl = getAppUrl();

  const subject = `Fahrt abgelehnt: ${data.patientName} am ${formattedDate}`;

  const body = `
Eine Fahrt wurde abgelehnt und erfordert eine Neuzuweisung:

Fahrer: ${data.driverName}
Patient: ${data.patientName}
Geplante Abholzeit: ${formattedDate} um ${formattedTime}

Bitte weise die Fahrt einem anderen Fahrer zu:
${appUrl}/rides/${data.rideId}

Mit freundlichen Gruessen,
Fahrdienst-System
`.trim();

  const html = createHtmlTemplate({
    heading: 'Fahrt abgelehnt',
    body: `
      <p style="color: #dc2626; font-weight: 600;">Eine Fahrt wurde abgelehnt und erfordert eine Neuzuweisung.</p>
      <div class="info-block">
        <div class="info-row">
          <span class="info-label">Fahrer:</span>
          <span class="info-value">${escapeHtml(data.driverName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Patient:</span>
          <span class="info-value">${escapeHtml(data.patientName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Geplante Abholzeit:</span>
          <span class="info-value">${escapeHtml(formattedDate)} um ${escapeHtml(formattedTime)}</span>
        </div>
      </div>
      <p>Bitte weise die Fahrt einem anderen Fahrer zu.</p>
    `,
    buttonText: 'Fahrt zuweisen',
    buttonUrl: `${appUrl}/rides/${escapeHtml(data.rideId)}`,
  });

  return sendEmail({
    to: data.dispatcherEmail,
    subject,
    body,
    html,
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
  const formattedDate = formatDate(pickupTime);
  const formattedTime = formatTime(pickupTime);
  const appUrl = getAppUrl();

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

  const html = createHtmlTemplate({
    heading: 'Fahrt bestaetigt',
    body: `
      <p>Hallo ${escapeHtml(driverName)},</p>
      <p>Du hast folgende Fahrt bestaetigt:</p>
      <div class="info-block">
        <div class="info-row">
          <span class="info-label">Patient:</span>
          <span class="info-value">${escapeHtml(patientName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ziel:</span>
          <span class="info-value">${escapeHtml(destinationName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Abholzeit:</span>
          <span class="info-value">${escapeHtml(formattedDate)} um ${escapeHtml(formattedTime)}</span>
        </div>
      </div>
      <p style="color: #16a34a; font-weight: 600;">Wir freuen uns auf dich!</p>
    `,
    buttonText: 'Meine Fahrten',
    buttonUrl: `${appUrl}/my-rides`,
  });

  return sendEmail({
    to: driverEmail,
    subject,
    body,
    html,
    metadata: {
      type: 'ride_confirmation',
      driverEmail,
    },
  });
}
