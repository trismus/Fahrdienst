-- Fahrdienst Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enum types
create type ride_status as enum ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled');
create type weekday as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');

-- Patients table
create table patients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  phone text not null,
  special_needs text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Drivers table
create table drivers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Destinations table
create table destinations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  arrival_window_start time not null,
  arrival_window_end time not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Rides table
create table rides (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete restrict,
  driver_id uuid references drivers(id) on delete set null,
  destination_id uuid not null references destinations(id) on delete restrict,
  pickup_time timestamp with time zone not null,
  arrival_time timestamp with time zone not null,
  return_time timestamp with time zone,
  status ride_status not null default 'planned',
  recurrence_group uuid,
  estimated_duration integer, -- minutes
  estimated_distance numeric(10,2), -- kilometers
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Availability blocks table (2-hour intervals)
create table availability_blocks (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references drivers(id) on delete cascade,
  weekday weekday not null,
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(driver_id, weekday, start_time)
);

-- Absences table
create table absences (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references drivers(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  check (to_date >= from_date)
);

-- Indexes for common queries
create index idx_rides_driver on rides(driver_id);
create index idx_rides_patient on rides(patient_id);
create index idx_rides_destination on rides(destination_id);
create index idx_rides_pickup_time on rides(pickup_time);
create index idx_rides_status on rides(status);
create index idx_rides_recurrence_group on rides(recurrence_group);
create index idx_availability_driver on availability_blocks(driver_id);
create index idx_absences_driver on absences(driver_id);
create index idx_absences_dates on absences(from_date, to_date);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger patients_updated_at before update on patients
  for each row execute function update_updated_at();

create trigger drivers_updated_at before update on drivers
  for each row execute function update_updated_at();

create trigger destinations_updated_at before update on destinations
  for each row execute function update_updated_at();

create trigger rides_updated_at before update on rides
  for each row execute function update_updated_at();

create trigger availability_blocks_updated_at before update on availability_blocks
  for each row execute function update_updated_at();

create trigger absences_updated_at before update on absences
  for each row execute function update_updated_at();

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
alter table patients enable row level security;
alter table drivers enable row level security;
alter table destinations enable row level security;
alter table rides enable row level security;
alter table availability_blocks enable row level security;
alter table absences enable row level security;

-- NOTE: Role-based RLS policies are defined in the migration files:
-- - 001_master_data.sql (profiles, patients, drivers, destinations)
-- - 004_rides_and_availability.sql (rides, availability_blocks, absences)
-- - 006_rls_policy_improvements.sql (driver patient access, driver phone update)
-- - 008_fix_rls_policies.sql (delete policies, cleanup permissive policies)
-- - 009_fix_driver_admin_read_policy.sql (admin access to inactive drivers)
--
-- DO NOT add permissive policies (using (true)) here.
-- For fresh setups, run the migration files in order after this schema.
