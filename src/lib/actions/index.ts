/**
 * Server Actions Index
 *
 * IMPORTANT: Use v2 modules for new code - they include security controls:
 * - patients-v2.ts
 * - drivers-v2.ts
 * - destinations-v2.ts
 * - rides-v2.ts
 * - rides-driver.ts (for driver-specific actions)
 *
 * The original modules are deprecated and will throw errors.
 */

// Re-export v2 modules as the default
export * from './patients-v2';
export * from './drivers-v2';
export * from './destinations-v2';
export * from './rides-v2';
export * from './rides-driver';
export * from './ride-assignment';
export * from './auth';
export * from './logs';
