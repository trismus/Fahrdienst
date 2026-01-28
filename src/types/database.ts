// =============================================================================
// DATABASE TYPES - Matches Supabase Schema
// =============================================================================

// Enums
export type UserRole = 'admin' | 'operator' | 'driver';
export type VehicleType = 'car' | 'van' | 'accessible_van';
export type DestinationType = 'hospital' | 'doctor' | 'therapy' | 'other';

// =============================================================================
// PROFILE
// =============================================================================

export interface Profile {
  id: string;
  role: UserRole;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileRow {
  id: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// PATIENT
// =============================================================================

export interface Patient {
  id: string;
  patientNumber: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  phone: string;
  email: string | null;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  pickupInstructions: string | null;
  needsWheelchair: boolean;
  needsWalker: boolean;
  needsAssistance: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  insurance: string | null;
  costCenter: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientRow {
  id: string;
  patient_number: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  phone: string;
  email: string | null;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  pickup_instructions: string | null;
  needs_wheelchair: boolean;
  needs_walker: boolean;
  needs_assistance: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  insurance: string | null;
  cost_center: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientInput {
  patientNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone: string;
  email?: string;
  street: string;
  postalCode: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  pickupInstructions?: string;
  needsWheelchair?: boolean;
  needsWalker?: boolean;
  needsAssistance?: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insurance?: string;
  costCenter?: string;
  notes?: string;
}

export interface UpdatePatientInput extends Partial<CreatePatientInput> {
  isActive?: boolean;
}

// =============================================================================
// DRIVER
// =============================================================================

export interface Driver {
  id: string;
  userId: string | null;
  driverCode: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  homeCity: string | null;
  homeStreet: string | null;
  homePostalCode: string | null;
  hasDrivingLicense: boolean;
  vehicleType: VehicleType;
  vehiclePlate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DriverRow {
  id: string;
  user_id: string | null;
  driver_code: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  home_city: string | null;
  home_street: string | null;
  home_postal_code: string | null;
  has_driving_license: boolean;
  vehicle_type: VehicleType;
  vehicle_plate: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDriverInput {
  userId?: string;
  driverCode?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  homeCity?: string;
  homeStreet?: string;
  homePostalCode?: string;
  hasDrivingLicense?: boolean;
  vehicleType?: VehicleType;
  vehiclePlate?: string;
  notes?: string;
}

export interface UpdateDriverInput extends Partial<CreateDriverInput> {
  isActive?: boolean;
}

// =============================================================================
// DESTINATION
// =============================================================================

export interface Destination {
  id: string;
  externalId: string | null;
  name: string;
  destinationType: DestinationType;
  department: string | null;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  openingHours: string | null;
  arrivalInstructions: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DestinationRow {
  id: string;
  external_id: string | null;
  name: string;
  destination_type: DestinationType;
  department: string | null;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  opening_hours: string | null;
  arrival_instructions: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDestinationInput {
  externalId?: string;
  name: string;
  destinationType?: DestinationType;
  department?: string;
  street: string;
  postalCode: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  openingHours?: string;
  arrivalInstructions?: string;
  notes?: string;
}

export interface UpdateDestinationInput extends Partial<CreateDestinationInput> {
  isActive?: boolean;
}

// =============================================================================
// UTILITY FUNCTIONS - Row to Entity Conversion
// =============================================================================

export function patientRowToEntity(row: PatientRow): Patient {
  return {
    id: row.id,
    patientNumber: row.patient_number,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    phone: row.phone,
    email: row.email,
    street: row.street,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    pickupInstructions: row.pickup_instructions,
    needsWheelchair: row.needs_wheelchair,
    needsWalker: row.needs_walker,
    needsAssistance: row.needs_assistance,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    insurance: row.insurance,
    costCenter: row.cost_center,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function driverRowToEntity(row: DriverRow): Driver {
  return {
    id: row.id,
    userId: row.user_id,
    driverCode: row.driver_code,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    homeCity: row.home_city,
    homeStreet: row.home_street,
    homePostalCode: row.home_postal_code,
    hasDrivingLicense: row.has_driving_license,
    vehicleType: row.vehicle_type,
    vehiclePlate: row.vehicle_plate,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function destinationRowToEntity(row: DestinationRow): Destination {
  return {
    id: row.id,
    externalId: row.external_id,
    name: row.name,
    destinationType: row.destination_type,
    department: row.department,
    street: row.street,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    email: row.email,
    openingHours: row.opening_hours,
    arrivalInstructions: row.arrival_instructions,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// UTILITY FUNCTIONS - Entity to Row Conversion (for inserts/updates)
// =============================================================================

export function patientInputToRow(input: CreatePatientInput): Partial<PatientRow> {
  return {
    patient_number: input.patientNumber,
    first_name: input.firstName,
    last_name: input.lastName,
    date_of_birth: input.dateOfBirth,
    phone: input.phone,
    email: input.email,
    street: input.street,
    postal_code: input.postalCode,
    city: input.city,
    country: input.country ?? 'CH',
    latitude: input.latitude,
    longitude: input.longitude,
    pickup_instructions: input.pickupInstructions,
    needs_wheelchair: input.needsWheelchair ?? false,
    needs_walker: input.needsWalker ?? false,
    needs_assistance: input.needsAssistance ?? false,
    emergency_contact_name: input.emergencyContactName,
    emergency_contact_phone: input.emergencyContactPhone,
    insurance: input.insurance,
    cost_center: input.costCenter,
    notes: input.notes,
  };
}

export function driverInputToRow(input: CreateDriverInput): Partial<DriverRow> {
  return {
    user_id: input.userId,
    driver_code: input.driverCode,
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone,
    email: input.email,
    home_city: input.homeCity,
    home_street: input.homeStreet,
    home_postal_code: input.homePostalCode,
    has_driving_license: input.hasDrivingLicense ?? true,
    vehicle_type: input.vehicleType ?? 'car',
    vehicle_plate: input.vehiclePlate,
    notes: input.notes,
  };
}

export function destinationInputToRow(input: CreateDestinationInput): Partial<DestinationRow> {
  return {
    external_id: input.externalId,
    name: input.name,
    destination_type: input.destinationType ?? 'other',
    department: input.department,
    street: input.street,
    postal_code: input.postalCode,
    city: input.city,
    country: input.country ?? 'CH',
    latitude: input.latitude,
    longitude: input.longitude,
    phone: input.phone,
    email: input.email,
    opening_hours: input.openingHours,
    arrival_instructions: input.arrivalInstructions,
    notes: input.notes,
  };
}
