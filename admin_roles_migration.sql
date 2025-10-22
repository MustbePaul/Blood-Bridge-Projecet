-- Admin roles migration: introduce system_admin and blood_bank_admin, and enforce via RLS
-- Safe/idempotent: re-runnable; uses dynamic constraint drops and IF checks for policies

-- 0) Ensure helper schema exists (from previous migration)
create schema if not exists app;

-- 1) Safely extend profiles.role constraint to include new admin roles
-- Find and drop existing role CHECK constraint (name is unknown), then add explicit one.
DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%role = ANY%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cname);
  END IF;

  -- Add a new explicit constraint allowing new roles; keep legacy "admin" for backward compatibility
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role = ANY (ARRAY[
        'system_admin', 'blood_bank_admin', -- new
        'blood_bank_staff', 'hospital_staff', 'donor',
        'admin' -- legacy, treated as system_admin
      ]));
  END IF;
END $$;

-- 2) Helper functions (if not present) - re-create is safe
create or replace function app.current_role()
returns text
language sql stable
as $$
  select p.role from public.profiles p where p.user_id = auth.uid()
$$;

create or replace function app.current_blood_bank_id()
returns uuid
language sql stable
as $$
  select p.blood_bank_id from public.profiles p where p.user_id = auth.uid()
$$;

create or replace function app.current_blood_bank_facility_id()
returns uuid
language sql stable
as $$
  select b.facility_id
  from public.blood_banks b
  join public.profiles p on p.blood_bank_id = b.blood_bank_id
  where p.user_id = auth.uid()
$$;

create or replace function app.current_hospital_id()
returns uuid
language sql stable
as $$
  select p.hospital_id from public.profiles p where p.user_id = auth.uid()
$$;

create or replace function app.current_hospital_facility_id()
returns uuid
language sql stable
as $$
  select h.facility_id
  from public.hospitals h
  join public.profiles p on p.hospital_id = h.id
  where p.user_id = auth.uid()
$$;

-- 3) Enable RLS on affected tables (no-op if already enabled)
alter table if exists public.profiles enable row level security;
alter table if exists public.hospitals enable row level security;
alter table if exists public.blood_banks enable row level security;
alter table if exists public.facilities enable row level security;
alter table if exists public.blood_inventory enable row level security;
alter table if exists public.blood_inventory_audit enable row level security;
alter table if exists public.blood_request enable row level security;
alter table if exists public.blood_transfers enable row level security;
alter table if exists public.donors enable row level security;
alter table if exists public.donation_records enable row level security;
alter table if exists public.donors_banks enable row level security;

-- 4) System Admin policies (read/update orgs and profiles; nothing else)
-- Profiles: system_admin (and legacy admin) can read/update all profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_admin_read'
  ) THEN
    EXECUTE $$create policy profiles_admin_read on public.profiles
      for select using (app.current_role() in ('system_admin','admin'))$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_admin_update'
  ) THEN
    EXECUTE $$create policy profiles_admin_update on public.profiles
      for update using (app.current_role() in ('system_admin','admin'))$$;
  END IF;
END $$;

-- Hospitals: system_admin full read/insert/update
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='hospitals' AND policyname='hospitals_admin_all'
  ) THEN
    EXECUTE $$create policy hospitals_admin_all on public.hospitals
      for all using (app.current_role() in ('system_admin','admin'))
      with check (app.current_role() in ('system_admin','admin'))$$;
  END IF;
END $$;

-- Blood Banks: system_admin full read/insert/update
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_banks' AND policyname='banks_admin_all'
  ) THEN
    EXECUTE $$create policy banks_admin_all on public.blood_banks
      for all using (app.current_role() in ('system_admin','admin'))
      with check (app.current_role() in ('system_admin','admin'))$$;
  END IF;
END $$;

-- Facilities: system_admin full read/insert/update
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='facilities' AND policyname='facilities_admin_all'
  ) THEN
    EXECUTE $$create policy facilities_admin_all on public.facilities
      for all using (app.current_role() in ('system_admin','admin'))
      with check (app.current_role() in ('system_admin','admin'))$$;
  END IF;
END $$;

-- 5) Blood Bank Admin policies (mirror bank staff + org user management)
-- Profiles: bank admin can manage profiles in their bank
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_bank_admin_read_org'
  ) THEN
    EXECUTE $$create policy profiles_bank_admin_read_org on public.profiles
      for select using (
        app.current_role() = 'blood_bank_admin' and profiles.blood_bank_id = app.current_blood_bank_id()
      )$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_bank_admin_update_org'
  ) THEN
    EXECUTE $$create policy profiles_bank_admin_update_org on public.profiles
      for update using (
        app.current_role() = 'blood_bank_admin' and profiles.blood_bank_id = app.current_blood_bank_id()
      )$$;
  END IF;
END $$;

-- Inventory: allow bank admin at their facility (parallel to blood_bank_staff)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_inventory' AND policyname='inv_read_bank_admin'
  ) THEN
    EXECUTE $$create policy inv_read_bank_admin on public.blood_inventory
      for select using (app.current_role() = 'blood_bank_admin' and facility_id = app.current_blood_bank_facility_id())$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_inventory' AND policyname='inv_update_bank_admin'
  ) THEN
    EXECUTE $$create policy inv_update_bank_admin on public.blood_inventory
      for update using (app.current_role() = 'blood_bank_admin' and facility_id = app.current_blood_bank_facility_id())$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_inventory' AND policyname='inv_insert_bank_admin'
  ) THEN
    EXECUTE $$create policy inv_insert_bank_admin on public.blood_inventory
      for insert with check (app.current_role() = 'blood_bank_admin' and facility_id = app.current_blood_bank_facility_id())$$;
  END IF;
END $$;

-- Inventory audit: bank admin at their facility
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_inventory_audit' AND policyname='inv_audit_read_bank_admin'
  ) THEN
    EXECUTE $$create policy inv_audit_read_bank_admin on public.blood_inventory_audit
      for select using (app.current_role() = 'blood_bank_admin' and facility_id = app.current_blood_bank_facility_id())$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_inventory_audit' AND policyname='inv_audit_insert_bank_admin'
  ) THEN
    EXECUTE $$create policy inv_audit_insert_bank_admin on public.blood_inventory_audit
      for insert with check (app.current_role() = 'blood_bank_admin' and facility_id = app.current_blood_bank_facility_id())$$;
  END IF;
END $$;

-- Blood requests: bank admin can read/update requests assigned to their bank
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_request' AND policyname='req_read_bank_admin'
  ) THEN
    EXECUTE $$create policy req_read_bank_admin on public.blood_request
      for select using (app.current_role() = 'blood_bank_admin' and assigned_blood_bank_id = app.current_blood_bank_id())$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_request' AND policyname='req_update_bank_admin'
  ) THEN
    EXECUTE $$create policy req_update_bank_admin on public.blood_request
      for update using (app.current_role() = 'blood_bank_admin' and assigned_blood_bank_id = app.current_blood_bank_id())$$;
  END IF;
END $$;

-- Blood transfers: bank admin can manage from their facility
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_transfers' AND policyname='xfer_insert_bank_admin'
  ) THEN
    EXECUTE $$create policy xfer_insert_bank_admin on public.blood_transfers
      for insert with check (app.current_role() = 'blood_bank_admin' and from_facility_id = app.current_blood_bank_facility_id())$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_transfers' AND policyname='xfer_update_bank_admin'
  ) THEN
    EXECUTE $$create policy xfer_update_bank_admin on public.blood_transfers
      for update using (app.current_role() = 'blood_bank_admin' and from_facility_id = app.current_blood_bank_facility_id())$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_transfers' AND policyname='xfer_read_bank_admin'
  ) THEN
    EXECUTE $$create policy xfer_read_bank_admin on public.blood_transfers
      for select using (app.current_role() = 'blood_bank_admin' and from_facility_id = app.current_blood_bank_facility_id())$$;
  END IF;
END $$;

-- Donors: bank admin can read/update donors they manage (via donors_banks)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='donors' AND policyname='donors_bank_admin_read'
  ) THEN
    EXECUTE $$create policy donors_bank_admin_read on public.donors
      for select using (
        app.current_role() = 'blood_bank_admin'
        and exists (
          select 1 from public.donors_banks db
          where db.donor_id = donors.donor_id
            and db.blood_bank_id = app.current_blood_bank_id()
        )
      )$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='donors' AND policyname='donors_bank_admin_update'
  ) THEN
    EXECUTE $$create policy donors_bank_admin_update on public.donors
      for update using (
        app.current_role() = 'blood_bank_admin'
        and exists (
          select 1 from public.donors_banks db
          where db.donor_id = donors.donor_id
            and db.blood_bank_id = app.current_blood_bank_id()
        )
      )$$;
  END IF;
END $$;

-- Donation records: bank admin can read donations for their donors
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='donation_records' AND policyname='donrec_bank_admin_read'
  ) THEN
    EXECUTE $$create policy donrec_bank_admin_read on public.donation_records
      for select using (
        app.current_role() = 'blood_bank_admin'
        and exists (
          select 1 from public.donors_banks db
          where db.donor_id = donation_records.donor_id
            and db.blood_bank_id = app.current_blood_bank_id()
        )
      )$$;
  END IF;
END $$;

-- donors_banks: bank admin can read their mappings (optional)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='donors_banks' AND policyname='donors_banks_bank_admin_read'
  ) THEN
    EXECUTE $$create policy donors_banks_bank_admin_read on public.donors_banks
      for select using (app.current_role() = 'blood_bank_admin' and blood_bank_id = app.current_blood_bank_id())$$;
  END IF;
END $$;

-- NOTE:
-- - System Admin is intentionally NOT granted access to donors, donation_records, blood_inventory,
--   blood_inventory_audit, blood_request, or blood_transfers. They manage orgs and user profiles only.
-- - Blood Bank Admin mirrors bank staff within their org, plus can manage profiles under their bank.
