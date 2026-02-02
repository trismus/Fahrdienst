/**
 * Phone Number Masking Utility
 *
 * GDPR-compliant phone number masking for logging and error messages.
 * Never log full phone numbers - they are PII (Personally Identifiable Information).
 */

/**
 * Masks a phone number for safe logging.
 * Preserves country code (first 3 chars) and last 2 digits for debugging.
 *
 * @param phone - The phone number to mask
 * @returns Masked phone number, e.g., "+41*******67"
 *
 * @example
 * maskPhoneNumber("+41791234567") // Returns "+41*******67"
 * maskPhoneNumber("0791234567")   // Returns "079******67"
 * maskPhoneNumber("")             // Returns "****"
 * maskPhoneNumber(null)           // Returns "****"
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone || phone.length < 4) {
    return '****';
  }

  // Determine how many characters to show
  // For international format: show country code (first 3) and last 2
  // For local format: show first 3 and last 2
  const prefix = phone.slice(0, 3);
  const suffix = phone.slice(-2);

  // Calculate how many asterisks needed
  const maskedLength = phone.length - 5;

  if (maskedLength <= 0) {
    // Very short number, just mask the middle
    return `${phone[0]}***${phone[phone.length - 1]}`;
  }

  const masked = '*'.repeat(maskedLength);
  return `${prefix}${masked}${suffix}`;
}

/**
 * Checks if a string appears to be a phone number.
 * Used to detect accidental PII in log messages.
 *
 * @param text - Text to check
 * @returns True if the text looks like a phone number
 */
export function looksLikePhoneNumber(text: string): boolean {
  // Remove common separators
  const cleaned = text.replace(/[\s\-().]/g, '');

  // Check for phone number patterns
  const patterns = [
    /^\+\d{10,15}$/, // International format
    /^0\d{9,11}$/, // Local format (Swiss)
    /^\d{10,11}$/, // Plain digits
  ];

  return patterns.some((pattern) => pattern.test(cleaned));
}

/**
 * Sanitizes a log message by masking any phone numbers found in it.
 *
 * @param message - Log message that may contain phone numbers
 * @returns Sanitized message with masked phone numbers
 */
export function sanitizeLogMessage(message: string): string {
  // Match phone number patterns in text
  const phonePatterns = [
    /\+\d{2,3}[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4}/g, // +41 79 123 45 67
    /0\d{2,3}[\s\-]?\d{2,4}[\s\-]?\d{2,4}/g, // 079 123 45 67
  ];

  let sanitized = message;

  for (const pattern of phonePatterns) {
    sanitized = sanitized.replace(pattern, (match) => maskPhoneNumber(match));
  }

  return sanitized;
}

/**
 * Creates a safe log object by masking phone numbers in specified fields.
 *
 * @param obj - Object to sanitize
 * @param phoneFields - Field names that contain phone numbers
 * @returns New object with masked phone numbers
 */
export function createSafeLogObject<T extends Record<string, unknown>>(
  obj: T,
  phoneFields: (keyof T)[] = ['phone', 'recipientPhone', 'patientPhone', 'driverPhone', 'emergencyPhone']
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...obj };

  for (const field of phoneFields) {
    if (typeof result[field as string] === 'string') {
      result[field as string] = maskPhoneNumber(result[field as string] as string);
    }
  }

  return result;
}
