/**
 * Environment Variable Validation
 *
 * Validates that required environment variables are set.
 * Fails fast at startup rather than at runtime.
 */

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Required environment variables for the application to function.
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

/**
 * Environment variables required for specific features.
 */
const FEATURE_ENV_VARS = {
  googleMapsServer: ['GOOGLE_MAPS_SERVER_API_KEY'],
  sms: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'],
  redis: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
} as const;

/**
 * Validates that all required environment variables are set.
 * Throws an error if any are missing.
 *
 * @throws Error if required environment variables are missing
 */
export function validateRequiredEnvVars(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        `Please check your .env.local file or Vercel environment settings.`
    );
  }
}

/**
 * Validates environment variables and returns detailed results.
 * Does not throw, useful for health checks.
 */
export function validateEnvVars(): EnvValidationResult {
  const result: EnvValidationResult = {
    valid: true,
    missing: [],
    warnings: [],
  };

  // Check required vars
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      result.missing.push(key);
      result.valid = false;
    }
  }

  // Check feature vars and add warnings
  if (!process.env.GOOGLE_MAPS_SERVER_API_KEY) {
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      result.warnings.push(
        'GOOGLE_MAPS_SERVER_API_KEY not set. Falling back to client key for server operations (less secure).'
      );
    } else {
      result.warnings.push('No Google Maps API key configured. Map features will not work.');
    }
  }

  if (process.env.SMS_ENABLED === 'true') {
    for (const key of FEATURE_ENV_VARS.sms) {
      if (!process.env[key]) {
        result.warnings.push(`SMS is enabled but ${key} is not set.`);
      }
    }
  }

  // Check for production environment
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      result.warnings.push(
        'Running in production without Redis. Rate limiting will use in-memory store (not recommended for serverless).'
      );
    }
  }

  return result;
}

/**
 * Checks if a specific feature is properly configured.
 */
export function isFeatureConfigured(feature: keyof typeof FEATURE_ENV_VARS): boolean {
  return FEATURE_ENV_VARS[feature].every((key) => !!process.env[key]);
}

/**
 * Gets the app URL for origin validation.
 * Handles Vercel deployment URLs automatically.
 */
export function getAppUrl(): string {
  // Vercel automatically sets this
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Custom app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Development fallback
  return 'http://localhost:3000';
}

/**
 * Gets allowed origins for CORS/origin validation.
 */
export function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Add main app URL
  const appUrl = getAppUrl();
  origins.push(appUrl);

  // Development
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://127.0.0.1:3000');
  }

  // Vercel preview deployments
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  // Custom additional origins (comma-separated)
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()));
  }

  return [...new Set(origins)]; // Remove duplicates
}
