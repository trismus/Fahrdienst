# Supabase Migrations

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to SQL Editor → New Query
4. Copy the content of the migration file
5. Click "Run"

### Option 2: Supabase CLI
```bash
supabase db push
```

## Available Migrations

### add_write_policies.sql
**Purpose:** Adds RLS write policies (INSERT, UPDATE, DELETE) for all tables

**Required:** YES - Without this, users cannot create/edit/delete data

**Status:** ⚠️ Currently allows all authenticated users full CRUD access

**TODO:** Replace with role-based policies (dispatcher vs driver roles)

**Tables affected:**
- patients
- drivers
- destinations
- rides
- availability_blocks
- absences

**Apply this migration immediately if you see errors like:**
```
new row violates row-level security policy for table "availability_blocks"
```

## Migration History

- `add_write_policies.sql` - Added 2026-01-28 - Fixes RLS blocking writes
