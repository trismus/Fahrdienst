-- Add missing write policies for RLS
-- This allows authenticated users to create, update, and delete data

-- Patients write policies
create policy "Authenticated users can insert patients"
  on patients for insert to authenticated with check (true);

create policy "Authenticated users can update patients"
  on patients for update to authenticated using (true);

create policy "Authenticated users can delete patients"
  on patients for delete to authenticated using (true);

-- Drivers write policies
create policy "Authenticated users can insert drivers"
  on drivers for insert to authenticated with check (true);

create policy "Authenticated users can update drivers"
  on drivers for update to authenticated using (true);

create policy "Authenticated users can delete drivers"
  on drivers for delete to authenticated using (true);

-- Destinations write policies
create policy "Authenticated users can insert destinations"
  on destinations for insert to authenticated with check (true);

create policy "Authenticated users can update destinations"
  on destinations for update to authenticated using (true);

create policy "Authenticated users can delete destinations"
  on destinations for delete to authenticated using (true);

-- Rides write policies
create policy "Authenticated users can insert rides"
  on rides for insert to authenticated with check (true);

create policy "Authenticated users can update rides"
  on rides for update to authenticated using (true);

create policy "Authenticated users can delete rides"
  on rides for delete to authenticated using (true);

-- Availability blocks write policies
create policy "Authenticated users can insert availability_blocks"
  on availability_blocks for insert to authenticated with check (true);

create policy "Authenticated users can update availability_blocks"
  on availability_blocks for update to authenticated using (true);

create policy "Authenticated users can delete availability_blocks"
  on availability_blocks for delete to authenticated using (true);

-- Absences write policies
create policy "Authenticated users can insert absences"
  on absences for insert to authenticated with check (true);

create policy "Authenticated users can update absences"
  on absences for update to authenticated using (true);

create policy "Authenticated users can delete absences"
  on absences for delete to authenticated using (true);
