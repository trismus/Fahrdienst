/**
 * Zod validation schemas for all entity inputs
 * Prevents XSS, data corruption, and enforces business rules
 */

import { z } from 'zod';

// =============================================================================
// SHARED VALIDATORS
// =============================================================================

// Strips HTML tags and dangerous characters to prevent XSS
const sanitizedString = (maxLength: number = 255) =>
  z
    .string()
    .max(maxLength)
    .transform((val) => val.trim())
    .refine((val) => !/<[^>]*>/g.test(val), {
      message: 'HTML tags are not allowed',
    });

// Swiss phone number format
const swissPhone = z
  .string()
  .regex(/^\+41\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/, {
    message: 'Invalid Swiss phone format. Expected: +41 XX XXX XX XX',
  });

// Swiss postal code
const swissPostalCode = z
  .string()
  .regex(/^\d{4}$/, {
    message: 'Invalid Swiss postal code. Expected: 4 digits',
  });

// Email validation
const email = z.string().email().max(255).optional().nullable();

// Date validation (ISO format YYYY-MM-DD)
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Invalid date format. Expected: YYYY-MM-DD',
  })
  .optional()
  .nullable();

// Latitude validation
const latitude = z
  .number()
  .min(-90)
  .max(90)
  .optional()
  .nullable();

// Longitude validation
const longitude = z
  .number()
  .min(-180)
  .max(180)
  .optional()
  .nullable();

// =============================================================================
// PATIENT SCHEMAS
// =============================================================================

export const createPatientSchema = z.object({
  patientNumber: sanitizedString(50).optional(),
  firstName: sanitizedString(100),
  lastName: sanitizedString(100),
  dateOfBirth: dateString,
  phone: swissPhone,
  email: email,
  street: sanitizedString(200),
  postalCode: swissPostalCode,
  city: sanitizedString(100),
  country: z.string().length(2).default('CH'),
  latitude: latitude,
  longitude: longitude,
  pickupInstructions: sanitizedString(500).optional().nullable(),
  needsWheelchair: z.boolean().default(false),
  needsWalker: z.boolean().default(false),
  needsAssistance: z.boolean().default(false),
  emergencyContactName: sanitizedString(200).optional().nullable(),
  emergencyContactPhone: swissPhone.optional().nullable(),
  insurance: sanitizedString(100).optional().nullable(),
  costCenter: sanitizedString(50).optional().nullable(),
  notes: sanitizedString(1000).optional().nullable(),
});

export const updatePatientSchema = createPatientSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

// =============================================================================
// DRIVER SCHEMAS
// =============================================================================

export const vehicleTypeSchema = z.enum(['car', 'van', 'accessible_van']);

export const createDriverSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  driverCode: sanitizedString(20).optional().nullable(),
  firstName: sanitizedString(100),
  lastName: sanitizedString(100),
  phone: swissPhone,
  email: email,
  homeCity: sanitizedString(100).optional().nullable(),
  homeStreet: sanitizedString(200).optional().nullable(),
  homePostalCode: swissPostalCode.optional().nullable(),
  hasDrivingLicense: z.boolean().default(true),
  vehicleType: vehicleTypeSchema.default('car'),
  vehiclePlate: z
    .string()
    .regex(/^[A-Z]{2}\s?\d{1,6}$/, {
      message: 'Invalid Swiss plate format. Expected: XX 123456',
    })
    .optional()
    .nullable(),
  notes: sanitizedString(1000).optional().nullable(),
});

export const updateDriverSchema = createDriverSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

// =============================================================================
// DESTINATION SCHEMAS
// =============================================================================

export const destinationTypeSchema = z.enum(['hospital', 'doctor', 'therapy', 'other']);

export const createDestinationSchema = z.object({
  externalId: sanitizedString(50).optional().nullable(),
  name: sanitizedString(200),
  destinationType: destinationTypeSchema.default('other'),
  department: sanitizedString(200).optional().nullable(),
  street: sanitizedString(200),
  postalCode: swissPostalCode,
  city: sanitizedString(100),
  country: z.string().length(2).default('CH'),
  latitude: latitude,
  longitude: longitude,
  phone: swissPhone.optional().nullable(),
  email: email,
  openingHours: sanitizedString(200).optional().nullable(),
  arrivalInstructions: sanitizedString(500).optional().nullable(),
  notes: sanitizedString(1000).optional().nullable(),
});

export const updateDestinationSchema = createDestinationSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateDestinationInput = z.infer<typeof createDestinationSchema>;
export type UpdateDestinationInput = z.infer<typeof updateDestinationSchema>;

// =============================================================================
// VALIDATION HELPER
// =============================================================================

export class ValidationError extends Error {
  public errors: z.ZodError['errors'];

  constructor(zodError: z.ZodError) {
    const message = zodError.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    super(`Validation failed: ${message}`);
    this.name = 'ValidationError';
    this.errors = zodError.errors;
  }
}

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  return result.data;
}
