'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Destination } from '@/types';

export async function getDestinations(): Promise<Destination[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getDestination(id: string): Promise<Destination | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data;
}

export interface CreateDestinationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  arrival_window_start: string;
  arrival_window_end: string;
}

export async function createDestination(data: CreateDestinationData): Promise<Destination> {
  const supabase = await createClient();
  const { data: destination, error } = await supabase
    .from('destinations')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/destinations');
  return destination;
}

export async function updateDestination(id: string, data: Partial<CreateDestinationData>): Promise<Destination> {
  const supabase = await createClient();
  const { data: destination, error } = await supabase
    .from('destinations')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/destinations');
  revalidatePath(`/destinations/${id}`);
  return destination;
}

export async function deleteDestination(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('destinations')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/destinations');
}
