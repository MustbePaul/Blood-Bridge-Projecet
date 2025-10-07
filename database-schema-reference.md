# Database Schema Reference (Updated)

This document provides the current schema and a ready-to-run migration script to align the database with the application code. The updates focus on ensuring the `blood_transfers` table supports multi-record listing with proper foreign keys, indexing, defaults, and row-level security (RLS) policies.

Use the SQL in the "Migration SQL" section below in the Supabase SQL editor (or psql) to apply changes safely.


## Tables

- profiles
- facilities
- donors
- blood_inventory
- blood_requests
- blood_transfers
- donation_records
- alerts

## blood_inventory Updates and Audit Trail

To tie each blood unit to a facility and capture who made changes:

- Add `facility_id` to `blood_inventory` pointing to `facilities(id)`
- Create immutable `blood_inventory_audit` to record per-change deltas with staff info

Migration SQL (run in Supabase SQL editor):

```sql
-- Add facility_id to blood_inventory if missing
alter table if exists public.blood_inventory
  add column if not exists facility_id uuid references public.facilities(id);

-- Audit table for inventory changes
create table if not exists public.blood_inventory_audit (
  id bigserial primary key,
  inventory_id uuid references public.blood_inventory(inventory_id) on delete set null,
  facility_id uuid references public.facilities(id),
  staff_user_id uuid references public.profiles(user_id),
  staff_role text check (staff_role in ('admin','hospital_staff','blood_bank_staff')),
  delta_units integer not null,
  action text not null check (action in ('ISSUE','RESERVE','RETURN','ADJUST','EXPIRE')),
  reason text,
  created_at timestamptz default now()
);

create index if not exists idx_bia_inventory_id on public.blood_inventory_audit(inventory_id);
create index if not exists idx_bia_facility_created_at on public.blood_inventory_audit(facility_id, created_at desc);

-- Enable RLS and example policies
alter table public.blood_inventory_audit enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where polname = 'audit_read_policy') then
    create policy audit_read_policy on public.blood_inventory_audit
      for select using (
        exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin')
        or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.facility_id = blood_inventory_audit.facility_id)
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where polname = 'audit_insert_policy') then
    create policy audit_insert_policy on public.blood_inventory_audit
      for insert with check (staff_user_id = auth.uid());
  end if;
end $$;
```


## blood_transfers Table

Required columns used by the app:
- id uuid primary key
- blood_type text
- quantity_units integer NOT NULL CHECK (quantity_units > 0)
- status text NOT NULL CHECK (status IN ('Pending','Approved','Processing','Completed','Failed'))
- created_at timestamptz NOT NULL DEFAULT now()
- updated_at timestamptz NOT NULL DEFAULT now()
- from_facility_id uuid NULL REFERENCES facilities(id) ON DELETE SET NULL
- to_facility_id uuid NULL REFERENCES facilities(id) ON DELETE SET NULL
- requested_by uuid NULL REFERENCES profiles(user_id) ON DELETE SET NULL

Recommended indexes:
- created_at (DESC)
- status
- from_facility_id
- to_facility_id

RLS (Row Level Security) policies (example):
- Admins can see everything
- Hospital staff: rows where to_facility_id = their facility
- Blood bank staff: rows where from_facility_id = their facility


## Migration SQL

Run this entire block once in Supabase SQL editor.

```sql
-- Enable required extension for UUIDs (Supabase has this by default, safe to include)
create extension if not exists pgcrypto;

-- Generic updated_at trigger for tables needing automatic timestamp updates
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Ensure facilities table exists (minimal shape). Remove if already managed elsewhere.
create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('hospital','blood_bank'))
);

-- Ensure profiles table exists with role and facility_id (minimal shape). Remove if already managed elsewhere.
create table if not exists public.profiles (
  user_id uuid primary key,
  name text,
  role text not null check (role in ('admin','hospital_staff','blood_bank_staff')),
  phone_number text,
  facility_id uuid references public.facilities(id)
);

-- Create blood_transfers if it doesn't exist
create table if not exists public.blood_transfers (
  id uuid primary key default gen_random_uuid(),
  blood_type text,
  quantity_units integer not null check (quantity_units > 0),
  status text not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  from_facility_id uuid references public.facilities(id) on delete set null,
  to_facility_id uuid references public.facilities(id) on delete set null,
  requested_by uuid references public.profiles(user_id) on delete set null
);

-- Add columns if missing (safe re-runs)
alter table public.blood_transfers add column if not exists blood_type text;
alter table public.blood_transfers add column if not exists quantity_units integer;
alter table public.blood_transfers add column if not exists status text;
alter table public.blood_transfers add column if not exists created_at timestamptz;
alter table public.blood_transfers add column if not exists updated_at timestamptz;
alter table public.blood_transfers add column if not exists from_facility_id uuid;
alter table public.blood_transfers add column if not exists to_facility_id uuid;
alter table public.blood_transfers add column if not exists requested_by uuid;

-- Defaults (safe if already set)
alter table public.blood_transfers alter column created_at set default now();
alter table public.blood_transfers alter column updated_at set default now();

-- Backfill created_at if null (optional; run once if table might contain nulls)
update public.blood_transfers set created_at = now() where created_at is null;
update public.blood_transfers set updated_at = now() where updated_at is null;

-- Quantity constraint
alter table public.blood_transfers alter column quantity_units set not null;

-- Status constraint (add if missing)
DO $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'blood_transfers_status_check'
  ) then
    alter table public.blood_transfers
      add constraint blood_transfers_status_check
      check (status in ('Pending','Approved','Processing','Completed','Failed'));
  end if;
end$$;

-- Foreign keys (add if missing)
DO $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'blood_transfers_from_facility_id_fkey'
  ) then
    alter table public.blood_transfers
      add constraint blood_transfers_from_facility_id_fkey
      foreign key (from_facility_id) references public.facilities(id) on delete set null;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'blood_transfers_to_facility_id_fkey'
  ) then
    alter table public.blood_transfers
      add constraint blood_transfers_to_facility_id_fkey
      foreign key (to_facility_id) references public.facilities(id) on delete set null;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'blood_transfers_requested_by_fkey'
  ) then
    alter table public.blood_transfers
      add constraint blood_transfers_requested_by_fkey
      foreign key (requested_by) references public.profiles(user_id) on delete set null;
  end if;
end $$;

-- Indexes (safe re-runs)
create index if not exists idx_blood_transfers_created_at on public.blood_transfers (created_at desc);
create index if not exists idx_blood_transfers_status on public.blood_transfers (status);
create index if not exists idx_blood_transfers_from_facility on public.blood_transfers (from_facility_id);
create index if not exists idx_blood_transfers_to_facility on public.blood_transfers (to_facility_id);

-- Updated_at trigger (idempotent)
DO $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_blood_transfers_updated_at'
  ) then
    create trigger set_blood_transfers_updated_at
    before update on public.blood_transfers
    for each row
    execute function set_updated_at();
  end if;
end $$;

-- Enable RLS and add policies (adjust as needed to your org rules)
alter table public.blood_transfers enable row level security;

-- Admins: full read access
DO $$
begin
  if not exists (select 1 from pg_policies where polname = 'select_blood_transfers_admin') then
    create policy select_blood_transfers_admin on public.blood_transfers
      for select to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.user_id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end $$;

-- Hospital staff: rows where to_facility_id matches their facility
DO $$
begin
  if not exists (select 1 from pg_policies where polname = 'select_blood_transfers_hospital') then
    create policy select_blood_transfers_hospital on public.blood_transfers
      for select to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.user_id = auth.uid() and p.role = 'hospital_staff' and p.facility_id = public.blood_transfers.to_facility_id
        )
      );
  end if;
end $$;

-- Blood bank staff: rows where from_facility_id matches their facility
DO $$
begin
  if not exists (select 1 from pg_policies where polname = 'select_blood_transfers_bank') then
    create policy select_blood_transfers_bank on public.blood_transfers
      for select to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.user_id = auth.uid() and p.role = 'blood_bank_staff' and p.facility_id = public.blood_transfers.from_facility_id
        )
      );
  end if;
end $$;

-- (Optional) Insert/Update policies can mirror the above logic if you create transfers from the app
```


## Notes

- The app now fetches blood transfers with a flat `select('*')` and enriches with facility names client-side using `from_facility_id` and `to_facility_id`. The schema above ensures those IDs exist and are indexed for fast lookups.
- If you previously had nested selects that caused 400 Bad Request responses, these changes avoid that path and rely on explicit joins done in the client.
- If you want to continue using nested selects, create PostgREST relationships by defining foreign keys exactly as shown above and ensure table/column names match.
- Ensure RLS policies are correct for your organization. The examples provided grant read access based on the user’s profile role and facility. Tighten or relax as necessary.


## Production Tailwind (separate from schema)

You saw a warning about the Tailwind CDN. For production builds, install Tailwind in your build pipeline:
- npm install -D tailwindcss postcss autoprefixer
- npx tailwindcss init -p
- Configure tailwind.config.js: `content: ["./src/**/*.{js,jsx,ts,tsx}"]`
- Add `@tailwind base; @tailwind components; @tailwind utilities;` to `src/index.css`
- Remove the CDN script from `public/index.html`

This will remove the production warning and produce optimized CSS.
