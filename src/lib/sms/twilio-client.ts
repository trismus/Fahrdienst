/**
 * Twilio SMS Client for Fahrdienst
 *
 * Handles the actual sending of SMS messages via Twilio.
 * Includes rate limiting and error handling.
 */

import { maskPhoneNumber } from '@/lib/utils/mask-phone';
import type { SmsMessage, SmsSendResult } from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  enabled: boolean;
}

function getConfig(): TwilioConfig {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
    enabled: process.env.SMS_ENABLED === 'true',
  };
}

// =============================================================================
// PHONE NUMBER VALIDATION
// =============================================================================

/**
 * Convert Swiss phone number to E.164 format.
 * Examples:
 * - 079 123 45 67 -> +41791234567
 * - 0791234567 -> +41791234567
 * - +41791234567 -> +41791234567
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If starts with 0, replace with +41 (Swiss country code)
  if (cleaned.startsWith('0')) {
    cleaned = '+41' + cleaned.slice(1);
  }

  // If no country code, assume Swiss
  if (!cleaned.startsWith('+')) {
    cleaned = '+41' + cleaned;
  }

  return cleaned;
}

/**
 * Validate phone number is in correct format.
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Swiss mobile numbers: +41 7x xxx xx xx (10 digits after +41)
  // Swiss landlines: +41 xx xxx xx xx (9-10 digits after +41)
  const swissRegex = /^\+41[1-9]\d{8,9}$/;
  // Generic international format
  const internationalRegex = /^\+[1-9]\d{7,14}$/;

  return swissRegex.test(formatted) || internationalRegex.test(formatted);
}

// =============================================================================
// RATE LIMITING
// =============================================================================

interface RateLimitState {
  minuteCount: number;
  minuteStart: number;
  hourCount: number;
  hourStart: number;
}

const rateLimitState: RateLimitState = {
  minuteCount: 0,
  minuteStart: Date.now(),
  hourCount: 0,
  hourStart: Date.now(),
};

const MAX_PER_MINUTE = 10;
const MAX_PER_HOUR = 100;

function checkRateLimit(): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();

  // Reset minute counter if needed
  if (now - rateLimitState.minuteStart > 60000) {
    rateLimitState.minuteCount = 0;
    rateLimitState.minuteStart = now;
  }

  // Reset hour counter if needed
  if (now - rateLimitState.hourStart > 3600000) {
    rateLimitState.hourCount = 0;
    rateLimitState.hourStart = now;
  }

  // Check limits
  if (rateLimitState.minuteCount >= MAX_PER_MINUTE) {
    const retryAfter = Math.ceil((60000 - (now - rateLimitState.minuteStart)) / 1000);
    return { allowed: false, retryAfter };
  }

  if (rateLimitState.hourCount >= MAX_PER_HOUR) {
    const retryAfter = Math.ceil((3600000 - (now - rateLimitState.hourStart)) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

function incrementRateLimit(): void {
  rateLimitState.minuteCount++;
  rateLimitState.hourCount++;
}

// =============================================================================
// TWILIO API
// =============================================================================

interface TwilioMessageResponse {
  sid: string;
  status: string;
  error_code?: number;
  error_message?: string;
}

/**
 * Send an SMS via Twilio REST API.
 * Uses fetch instead of the Twilio SDK to avoid additional dependencies.
 */
async function sendViaTwilio(
  message: SmsMessage,
  config: TwilioConfig
): Promise<SmsSendResult> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

  const formData = new URLSearchParams();
  formData.append('To', message.to);
  formData.append('From', config.fromNumber);
  formData.append('Body', message.body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data: TwilioMessageResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error_message || `HTTP ${response.status}`,
        errorCode: data.error_code?.toString(),
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      messageId: data.sid,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// =============================================================================
// MOCK SENDER (FOR DEVELOPMENT)
// =============================================================================

async function sendMock(message: SmsMessage): Promise<SmsSendResult> {
  // Log the message for development with GDPR-compliant masking
  console.log('=== MOCK SMS ===');
  console.log(`To: ${maskPhoneNumber(message.to)}`); // Never log full phone numbers
  console.log(`Type: ${message.notificationType}`);
  console.log(`Body (preview): ${message.body.slice(0, 50)}...`); // Don't log full message body
  console.log('================');

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    success: true,
    messageId: `mock_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Send an SMS message.
 *
 * @param message - The message to send
 * @returns Result of the send operation
 */
export async function sendSms(message: SmsMessage): Promise<SmsSendResult> {
  const config = getConfig();

  // Validate phone number
  if (!isValidPhoneNumber(message.to)) {
    return {
      success: false,
      error: 'Invalid phone number format',
      errorCode: 'INVALID_PHONE',
      timestamp: new Date().toISOString(),
    };
  }

  // Format phone number
  const formattedTo = formatPhoneNumber(message.to);

  // Check rate limit
  const rateLimit = checkRateLimit();
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds`,
      errorCode: 'RATE_LIMITED',
      timestamp: new Date().toISOString(),
    };
  }

  // Increment rate limit counter
  incrementRateLimit();

  // Send message
  const messageWithFormattedNumber = { ...message, to: formattedTo };

  if (!config.enabled) {
    console.log('[SMS] Service disabled, using mock sender');
    return sendMock(messageWithFormattedNumber);
  }

  if (!config.accountSid || !config.authToken || !config.fromNumber) {
    console.warn('[SMS] Twilio not configured, using mock sender');
    return sendMock(messageWithFormattedNumber);
  }

  return sendViaTwilio(messageWithFormattedNumber, config);
}

/**
 * Check if SMS service is properly configured.
 */
export function isSmsConfigured(): boolean {
  const config = getConfig();
  return !!(config.accountSid && config.authToken && config.fromNumber);
}

/**
 * Check if SMS service is enabled.
 */
export function isSmsEnabled(): boolean {
  return getConfig().enabled;
}
