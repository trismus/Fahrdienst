/**
 * SMS Message Templates for Fahrdienst
 *
 * All templates are in German as per project requirements.
 * Templates support variable interpolation using {{variableName}} syntax.
 */

import type { NotificationType, NotificationContext, RecipientType } from './types';

// =============================================================================
// TEMPLATE DEFINITIONS
// =============================================================================

interface MessageTemplate {
  subject: string; // For logging purposes
  body: string;
}

type TemplateKey = `${NotificationType}_${RecipientType}`;

/**
 * Message templates for each notification type and recipient combination.
 */
const TEMPLATES: Record<string, MessageTemplate> = {
  // ==========================================================================
  // RIDE ASSIGNED
  // ==========================================================================
  'ride_assigned_driver': {
    subject: 'Neue Fahrt zugewiesen',
    body: `Neue Fahrt zugewiesen:
{{patientName}}
{{pickupTime}} Uhr
Von: {{patientAddress}}
Nach: {{destinationName}}
{{#notes}}Hinweis: {{notes}}{{/notes}}`,
  },

  // ==========================================================================
  // RIDE CONFIRMED
  // ==========================================================================
  'ride_confirmed_patient': {
    subject: 'Fahrt bestaetigt',
    body: `Ihre Fahrt am {{pickupDate}} um {{pickupTime}} Uhr wurde bestaetigt.
Fahrer: {{driverName}}
Tel: {{driverPhone}}
Ziel: {{destinationName}}`,
  },

  // ==========================================================================
  // RIDE STARTED (Driver on the way)
  // ==========================================================================
  'ride_started_patient': {
    subject: 'Fahrer unterwegs',
    body: `Ihr Fahrer {{driverName}} ist jetzt unterwegs zu Ihnen.
Geschaetzte Ankunft: {{eta}} Uhr
Bei Fragen: {{driverPhone}}`,
  },

  // ==========================================================================
  // DRIVER ARRIVED AT PICKUP
  // ==========================================================================
  'driver_arrived_patient': {
    subject: 'Fahrer angekommen',
    body: `Ihr Fahrer {{driverName}} ist angekommen und wartet auf Sie.
Fahrzeug wartet vor: {{patientAddress}}`,
  },

  // ==========================================================================
  // PATIENT PICKED UP
  // ==========================================================================
  'patient_picked_up_destination': {
    subject: 'Patient abgeholt',
    body: `{{patientName}} wurde abgeholt.
Geschaetzte Ankunft: {{eta}} Uhr
Fahrer: {{driverName}}`,
  },

  // ==========================================================================
  // RIDE COMPLETED
  // ==========================================================================
  'ride_completed_patient': {
    subject: 'Fahrt abgeschlossen',
    body: `Ihre Fahrt zu {{destinationName}} wurde erfolgreich abgeschlossen.
Vielen Dank, dass Sie unseren Fahrdienst nutzen.`,
  },

  // ==========================================================================
  // RIDE CANCELLED
  // ==========================================================================
  'ride_cancelled_patient': {
    subject: 'Fahrt storniert',
    body: `Ihre Fahrt am {{pickupDate}} um {{pickupTime}} Uhr wurde storniert.
{{#cancellationReason}}Grund: {{cancellationReason}}{{/cancellationReason}}
Bei Fragen kontaktieren Sie bitte die Zentrale.`,
  },

  'ride_cancelled_driver': {
    subject: 'Fahrt storniert',
    body: `Fahrt storniert:
{{patientName}} am {{pickupDate}} um {{pickupTime}} Uhr
{{#cancellationReason}}Grund: {{cancellationReason}}{{/cancellationReason}}`,
  },

  // ==========================================================================
  // RIDE REMINDER
  // ==========================================================================
  'ride_reminder_patient': {
    subject: 'Erinnerung: Fahrt in {{reminderMinutes}} Minuten',
    body: `Erinnerung: Ihre Fahrt beginnt in {{reminderMinutes}} Minuten.
Abholung: {{pickupTime}} Uhr
Fahrer: {{driverName}}
Bitte halten Sie sich bereit.`,
  },

  'ride_reminder_driver': {
    subject: 'Erinnerung: Fahrt in {{reminderMinutes}} Minuten',
    body: `Erinnerung: Fahrt in {{reminderMinutes}} Minuten
{{patientName}}
Abholung: {{pickupTime}} Uhr
Von: {{patientAddress}}`,
  },
};

// =============================================================================
// TEMPLATE RENDERING
// =============================================================================

/**
 * Helper to format time from ISO string.
 */
function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Helper to format date from ISO string.
 */
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

/**
 * Simple template rendering with variable interpolation.
 * Supports:
 * - {{variable}} - Simple variable substitution
 * - {{#variable}}content{{/variable}} - Conditional sections (renders if variable is truthy)
 */
function renderTemplate(template: string, variables: Record<string, string | undefined>): string {
  let result = template;

  // Handle conditional sections first
  // Matches {{#variable}}content{{/variable}}
  const conditionalRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  result = result.replace(conditionalRegex, (_, varName, content) => {
    const value = variables[varName];
    if (value && value.trim()) {
      // Render the content with the variable
      return content.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value);
    }
    return '';
  });

  // Handle simple variable substitution
  const variableRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(variableRegex, (_, varName) => {
    return variables[varName] || '';
  });

  // Clean up extra whitespace from removed conditionals
  result = result.replace(/\n{3,}/g, '\n\n').trim();

  return result;
}

/**
 * Build template variables from notification context.
 */
function buildVariables(context: NotificationContext): Record<string, string | undefined> {
  const { ride, eta, cancellationReason, reminderMinutes } = context;

  return {
    // Ride info
    rideId: ride.rideId,
    pickupTime: formatTime(ride.pickupTime),
    pickupDate: formatDate(ride.pickupTime),
    arrivalTime: formatTime(ride.arrivalTime),

    // Patient info
    patientName: ride.patientName,
    patientPhone: ride.patientPhone,
    patientAddress: ride.patientAddress,

    // Destination info
    destinationName: ride.destinationName,
    destinationAddress: ride.destinationAddress,
    destinationPhone: ride.destinationPhone,

    // Driver info
    driverName: ride.driverName,
    driverPhone: ride.driverPhone,

    // Route info
    estimatedDuration: ride.estimatedDuration?.toString(),
    estimatedDistance: ride.estimatedDistance?.toString(),

    // Notes
    notes: ride.notes,

    // Context-specific
    eta: eta,
    cancellationReason: cancellationReason,
    reminderMinutes: reminderMinutes?.toString(),
  };
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get the rendered message for a notification.
 *
 * @param notificationType - Type of notification
 * @param recipientType - Type of recipient
 * @param context - Notification context with ride data
 * @returns Rendered message body, or null if no template exists
 */
export function getNotificationMessage(
  notificationType: NotificationType,
  recipientType: RecipientType,
  context: NotificationContext
): string | null {
  const templateKey: TemplateKey = `${notificationType}_${recipientType}`;
  const template = TEMPLATES[templateKey];

  if (!template) {
    console.warn(`No SMS template found for: ${templateKey}`);
    return null;
  }

  const variables = buildVariables(context);
  return renderTemplate(template.body, variables);
}

/**
 * Get all available template keys.
 */
export function getAvailableTemplates(): TemplateKey[] {
  return Object.keys(TEMPLATES) as TemplateKey[];
}

/**
 * Check if a template exists for a notification type and recipient.
 */
export function hasTemplate(notificationType: NotificationType, recipientType: RecipientType): boolean {
  const templateKey: TemplateKey = `${notificationType}_${recipientType}`;
  return templateKey in TEMPLATES;
}
