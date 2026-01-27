'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Patient } from '@/types';

export async function getPatients(): Promise<Patient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getPatient(id: string): Promise<Patient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data;
}

export interface CreatePatientData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  special_needs?: string;
  notes?: string;
}

export async function createPatient(data: CreatePatientData): Promise<Patient> {
  const supabase = await createClient();
  const { data: patient, error } = await supabase
    .from('patients')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/patients');
  return patient;
}

export async function updatePatient(id: string, data: Partial<CreatePatientData>): Promise<Patient> {
  const supabase = await createClient();
  const { data: patient, error } = await supabase
    .from('patients')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/patients');
  revalidatePath(`/patients/${id}`);
  return patient;
}

export async function deletePatient(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/patients');
}
