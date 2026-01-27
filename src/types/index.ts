// Ride status workflow: planned → confirmed → in_progress → completed (or cancelled)
export type RideStatus = 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface Patient {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  special_needs?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  arrival_window_start: string; // HH:mm format
  arrival_window_end: string;   // HH:mm format
  created_at: string;
  updated_at: string;
}

export interface Ride {
  id: string;
  patient_id: string;
  driver_id?: string;
  destination_id: string;
  pickup_time: string;          // ISO datetime
  arrival_time: string;         // ISO datetime
  return_time?: string;         // ISO datetime
  status: RideStatus;
  recurrence_group?: string;    // Groups recurring rides together
  estimated_duration?: number;  // Minutes
  estimated_distance?: number;  // Kilometers
  created_at: string;
  updated_at: string;
  // Relations (populated by joins)
  patient?: Patient;
  driver?: Driver;
  destination?: Destination;
}

export interface AvailabilityBlock {
  id: string;
  driver_id: string;
  weekday: Weekday;
  start_time: string; // HH:mm format
  end_time: string;   // HH:mm format
  created_at: string;
  updated_at: string;
}

export interface Absence {
  id: string;
  driver_id: string;
  from_date: string;  // ISO date
  to_date: string;    // ISO date
  reason?: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface DriverWithAvailability extends Driver {
  availability_blocks: AvailabilityBlock[];
  absences: Absence[];
}

export interface RideWithRelations extends Ride {
  patient: Patient;
  driver?: Driver;
  destination: Destination;
}
