'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Ride, RideWithRelations, RideStatus } from '@/types';

export async function getRides(filters?: {
  driverId?: string;
  status?: RideStatus;
  fromDate?: string;
  toDate?: string;
}): Promise<RideWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from('rides')
    .select(`
      *,
      patient:patients(*),
      driver:drivers(*),
      destination:destinations(*)
    `)
    .order('pickup_time');

  if (filters?.driverId) {
    query = query.eq('driver_id', filters.driverId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.fromDate) {
    query = query.gte('pickup_time', filters.fromDate);
  }
  if (filters?.toDate) {
    query = query.lte('pickup_time', filters.toDate);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getRide(id: string): Promise<RideWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rides')
    .select(`
      *,
      patient:patients(*),
      driver:drivers(*),
      destination:destinations(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data;
}

export async function getRidesForDriver(driverId: string): Promise<RideWithRelations[]> {
  return getRides({ driverId });
}

export async function getTodaysRidesForDriver(driverId: string): Promise<RideWithRelations[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getRides({
    driverId,
    fromDate: today.toISOString(),
    toDate: tomorrow.toISOString(),
  });
}

export interface CreateRideData {
  patient_id: string;
  driver_id?: string;
  destination_id: string;
  pickup_time: string;
  arrival_time: string;
  return_time?: string;
  status?: RideStatus;
  recurrence_group?: string;
  estimated_duration?: number;
  estimated_distance?: number;
}

export async function createRide(data: CreateRideData): Promise<Ride> {
  const supabase = await createClient();
  const { data: ride, error } = await supabase
    .from('rides')
    .insert({
      ...data,
      status: data.status || 'planned',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/rides');
  revalidatePath('/dashboard');
  return ride;
}

export async function updateRide(id: string, data: Partial<CreateRideData>): Promise<Ride> {
  const supabase = await createClient();
  const { data: ride, error } = await supabase
    .from('rides')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/rides');
  revalidatePath(`/rides/${id}`);
  revalidatePath('/dashboard');
  return ride;
}

export async function deleteRide(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('rides')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/rides');
  revalidatePath('/dashboard');
}

// Status transitions
export async function assignDriver(rideId: string, driverId: string): Promise<Ride> {
  return updateRide(rideId, { driver_id: driverId });
}

export async function confirmRide(rideId: string): Promise<Ride> {
  return updateRide(rideId, { status: 'confirmed' });
}

export async function rejectRide(rideId: string): Promise<Ride> {
  return updateRide(rideId, { driver_id: undefined, status: 'planned' });
}

export async function startRide(rideId: string): Promise<Ride> {
  return updateRide(rideId, { status: 'in_progress' });
}

export async function completeRide(rideId: string): Promise<Ride> {
  return updateRide(rideId, { status: 'completed' });
}

export async function cancelRide(rideId: string): Promise<Ride> {
  return updateRide(rideId, { status: 'cancelled' });
}

// Recurring rides
export async function createRecurringRides(
  baseData: Omit<CreateRideData, 'recurrence_group'>,
  pattern: {
    daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
    weeks: number;
  }
): Promise<Ride[]> {
  const recurrenceGroup = crypto.randomUUID();
  const rides: Ride[] = [];
  const startDate = new Date(baseData.pickup_time);

  for (let week = 0; week < pattern.weeks; week++) {
    for (const dayOfWeek of pattern.daysOfWeek) {
      const rideDate = new Date(startDate);
      rideDate.setDate(startDate.getDate() + week * 7 + (dayOfWeek - startDate.getDay()));

      if (rideDate >= startDate) {
        const pickupTime = new Date(rideDate);
        pickupTime.setHours(
          new Date(baseData.pickup_time).getHours(),
          new Date(baseData.pickup_time).getMinutes()
        );

        const arrivalTime = new Date(rideDate);
        arrivalTime.setHours(
          new Date(baseData.arrival_time).getHours(),
          new Date(baseData.arrival_time).getMinutes()
        );

        const ride = await createRide({
          ...baseData,
          pickup_time: pickupTime.toISOString(),
          arrival_time: arrivalTime.toISOString(),
          recurrence_group: recurrenceGroup,
        });
        rides.push(ride);
      }
    }
  }

  return rides;
}
