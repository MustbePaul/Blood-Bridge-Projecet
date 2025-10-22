-- Safe, idempotent migration for RBAC/RLS across Hospitals, Blood Banks, and Donors
-- Apply in Supabase SQL editor or via CLI. Re-runnable without side effects.

-- 0) Helper schema and functions for role/org lookups via profiles
create schema if not exists app;

create or replace function app.current_role()
returns text
language sql stable
as $$
  select p.role from public.profiles p where p.user_id = auth.uid()
$$;

create or replace function app.current_hospital_id()
returns uuid
language sql stable
as $$
  select p.hospital_id from public.profiles p where p.user_id = auth.uid()
$$;

create or replace function app.current_blood_bank_id()
returns uuid
language sql stable
as $$
  select p.blood_bank_id from public.profiles p where p.user_id = auth.uid()
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

create or replace function app.current_blood_bank_facility_id()
returns uuid
language sql stable
as $$
  select b.facility_id
  from public.blood_banks b
  join public.profiles p on p.blood_bank_id = b.blood_bank_id
  where p.user_id = auth.uid()
$$;

-- 1) Minimal schema links (safe: only adds if missing)
-- Donors -> auth.users for self-access
alter table public.donors
  add column if not exists user_id uuid references auth.users(id);

-- Organizations -> facilities for inventory scoping
alter table public.hospitals
  add column if not exists facility_id uuid references public.facilities(id);

alter table public.blood_banks
  add column if not exists facility_id uuid references public.facilities(id);

-- Requests assigned to specific blood bank
alter table public.blood_request
  add column if not exists assigned_blood_bank_id uuid references public.blood_banks(blood_bank_id);

-- Donor-to-bank mapping table (for bank-managed donors)
create table if not exists public.donors_banks (
  donor_id uuid not null references public.donors(donor_id) on delete cascade,
  blood_bank_id uuid not null references public.blood_banks(blood_bank_id) on delete cascade,
  primary key (donor_id, blood_bank_id)
);

-- Optional: ensure one donor user maps uniquely if set (partial unique index)
create unique index if not exists donors_user_id_unique
  on public.donors(user_id)
  where user_id is not null;

-- 2) Enable RLS
alter table if exists public.alerts                 enable row level security;
alter table if exists public.blood_banks            enable row level security;
alter table if exists public.blood_inventory        enable row level security;
alter table if exists public.blood_inventory_audit  enable row level security;
alter table if exists public.blood_request          enable row level security;
alter table if exists public.blood_transfers        enable row level security;
alter table if exists public.donation_records       enable row level security;
alter table if exists public.donors                 enable row level security;
alter table if exists public.donors_banks           enable row level security;
alter table if exists public.facilities             enable row level security;
alter table if exists public.hospitals              enable row level security;
alter table if exists public.profiles               enable row level security;

-- 3) Policies (created only if missing)
-- Utility: create policy if not exists
-- Note: Postgres doesn't support CREATE POLICY IF NOT EXISTS; use DO blocks checking pg_policies

-- profiles: self read/update
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_self_read'
  ) then
    execute 'create policy profiles_self_read on public.profiles for select using (user_id = auth.uid())';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_self_update'
  ) then
    execute 'create policy profiles_self_update on public.profiles for update using (user_id = auth.uid())';
  end if;
end $$;

-- alerts: only target user can read
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='alerts' and policyname='alerts_target_read'
  ) then
    execute 'create policy alerts_target_read on public.alerts for select using (target_user_id = auth.uid())';
  end if;
end $$;

-- hospitals / blood_banks: read own org row (optional)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='hospitals' and policyname='hospitals_read_if_member'
  ) then
    execute 'create policy hospitals_read_if_member on public.hospitals for select using (id = app.current_hospital_id())';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='blood_banks' and policyname='banks_read_if_member'
  ) then
    execute 'create policy banks_read_if_member on public.blood_banks for select using (blood_bank_id = app.current_blood_bank_id())';
  end if;
end $$;

-- blood_inventory: org-scoped by facility
-- read
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname=''public'' and tablename=''blood_inventory'' and policyname=''inv_read_hospital''
  ) then
    execute ''create policy inv_read_hospital on public.blood_inventory for select using (app.current_role() = ''''hospital_staff'''' and facility_id = app.current_hospital_facility_id())'';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname=''public'' and tablename=''blood_inventory'' and policyname=''inv_read_bank''
  ) then
    execute ''create policy inv_read_bank on public.blood_inventory for select using (app.current_role() = ''''blood_bank_staff'''' and facility_id = app.current_blood_bank_facility_id())'';
  end if;
end $$;

-- update
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname=''public'' and tablename=''blood_inventory'' and policyname=''inv_update_hospital''
  ) then
    execute ''create policy inv_update_hospital on public.blood_inventory for update using (app.current_role() = ''''hospital_staff'''' and facility_id = app.current_hospital_facility_id())'';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname=''public'' and tablename=''blood_inventory'' and policyname=''inv_update_bank''
  ) then
    execute ''create policy inv_update_bank on public.blood_inventory for update using (app.current_role() = ''''blood_bank_staff'''' and facility_id = app.current_blood_bank_facility_id())'';
  end if;
end $$;

-- insert
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname=''public'' and tablename=''blood_inventory'' and policyname=''inv_insert_hospital''
  ) then
    execute ''create policy inv_insert_hospital on public.blood_inventory for insert with check (app.current_role() = ''''hospital_staff'''' and facility_id = app.current_hospital_facility_id())'';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname=''public'' and tablename=''blood_inventory'' and policyname=''inv_insert_bank''
  ) then
    execute ''create policy inv_insert_bank on public.blood_inventory for insert with check (app.current_role() = ''''blood_bank_staff'''' and facility_id = app.current_blood_bank_facility_id())'';
  end if;
end $$;

-- blood_inventory_audit: org-scoped by facility
-- read
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname=''public'' and tablename=''blood_inventory_audit'' and policyname=''inv_audit_read_hospital''
  ) then
    execute ''create policy inv_audit_read_hospital on public.blood_inventory_audit for select using (app.current_role() = ''''hospital_staff'''' and facility_id = app.current_hospital_facility_id())'';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname=''public'' and tablename=''blood_inventory_audit'' and policyname=''inv_audit_read_bank''
  ) then
    execute ''create policy inv_audit_read_bank on public.blood_inventory_audit for select using (app.current_role() = ''''blood_bank_staff'''' and facility_id = app.current_blood_bank_facility_id())'';
  end if;
end $$;

-- insert
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname=''public'' and tablename=''blood_inventory_audit'' and policyname=''inv_audit_insert_hospital''
  ) then
    execute ''create policy inv_audit_insert_hospital on public.blood_inventory_audit for insert with check (app.current_role() = ''''hospital_staff'''' and facility_id = app.current_hospital_facility_id())'';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname=''public'' and tablename=''blood_inventory_audit'' and policyname=''inv_audit_insert_bank''
  ) then
    execute ''create policy inv_audit_insert_bank on public.blood_inventory_audit for insert with check (app.current_role() = ''''blood_bank_staff'''' and facility_id = app.current_blood_bank_facility_id())'';
  end if;
end $$;

-- blood_request: hospitals manage own; banks manage assigned
-- hospital insert/read/update
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='blood_request' and policyname='req_insert_hospital'
  ) then
    execute 'create policy req_insert_hospital on public.blood_request for insert with check (app.current_role() = ''hospital_staff'' and hospital_id = app.current_hospital_id())';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='blood_request' and policyname='req_read_hospital'
  ) then
    execute 'create policy req_read_hospital on public.blood_request for select using (app.current_role() = ''hospital_staff'' and hospital_id = app.current_hospital_id())';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='blood_request' and policyname='req_update_hospital'
  ) then
    execute 'create policy req_update_hospital on public.blood_request for update using (app.current_role() = ''hospital_staff'' and hospital_id = app.current_hospital_id())';
  end if;
end $$;

-- bank read/update assigned
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='blood_request' and policyname='req_read_bank'
  ) then
    execute 'create policy req_read_bank on public.blood_request for select using (app.current_role() = ''blood_bank_staff'' and assigned_blood_bank_id = app.current_blood_bank_id())';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='blood_request' and policyname='req_update_bank'
  ) then
    execute 'create policy req_update_bank on public.blood_request for update using (app.current_role() = ''blood_bank_staff'' and assigned_blood_bank_id = app.current_blood_bank_id())';
  end if;
end $$;

-- blood_transfers: bank from_*, hospital to_*
-- bank
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='blood_transfers' and policyname='xfer_insert_bank'
  ) then
    execute 'create policy xfer_insert_bank on public.blood_transfers for insert with check (app.current_role() = ''blood_bank_staff'' and from_facility_id = app.current_blood_bank_facility_id())';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='blood_transfers' and policyname='xfer_update_bank'
  ) then
    execute 'create policy xfer_update_bank on public.blood_transfers for update using (app.current_role() = ''blood_bank_staff'' and from_facility_id = app.current_blood_bank_facility_id())';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='blood_transfers' and policyname='xfer_read_bank'
  ) then
    execute 'create policy xfer_read_bank on public.blood_transfers for select using (app.current_role() = ''blood_bank_staff'' and from_facility_id = app.current_blood_bank_facility_id())';
  end if;
end $$;

-- hospital
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='blood_transfers' and policyname='xfer_read_hospital'
  ) then
    execute 'create policy xfer_read_hospital on public.blood_transfers for select using (app.current_role() = ''hospital_staff'' and to_facility_id = app.current_hospital_facility_id())';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='blood_transfers' and policyname='xfer_update_hospital'
  ) then
    execute 'create policy xfer_update_hospital on public.blood_transfers for update using (app.current_role() = ''hospital_staff'' and to_facility_id = app.current_hospital_facility_id())';
  end if;
end $$;

-- donors: donor self; bank via mapping
-- donor self-access
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='donors' and policyname='donors_self_read'
  ) then
    execute 'create policy donors_self_read on public.donors for select using (user_id = auth.uid())';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='donors' and policyname='donors_self_update'
  ) then
    execute 'create policy donors_self_update on public.donors for update using (user_id = auth.uid())';
  end if;
end $$;

-- bank access to managed donors
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='donors' and policyname='donors_bank_read'
  ) then
    execute 'create policy donors_bank_read on public.donors for select using (app.current_role() = ''blood_bank_staff'' and exists (select 1 from public.donors_banks db where db.donor_id = donors.donor_id and db.blood_bank_id = app.current_blood_bank_id()))';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='donors' and policyname='donors_bank_update'
  ) then
    execute 'create policy donors_bank_update on public.donors for update using (app.current_role() = ''blood_bank_staff'' and exists (select 1 from public.donors_banks db where db.donor_id = donors.donor_id and db.blood_bank_id = app.current_blood_bank_id()))';
  end if;
end $$;

-- donation_records: donor self; bank for managed donors
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='donation_records' and policyname='donrec_self_read'
  ) then
    execute 'create policy donrec_self_read on public.donation_records for select using (exists (select 1 from public.donors d where d.donor_id = donation_records.donor_id and d.user_id = auth.uid()))';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='donation_records' and policyname='donrec_bank_read'
  ) then
    execute 'create policy donrec_bank_read on public.donation_records for select using (app.current_role() = ''blood_bank_staff'' and exists (select 1 from public.donors_banks db where db.donor_id = donation_records.donor_id and db.blood_bank_id = app.current_blood_bank_id()))';
  end if;
end $$;

-- donors_banks: allow bank to read their own mappings (optional; no insert/update from clients by default)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='donors_banks' and policyname='donors_banks_bank_read'
  ) then
    execute 'create policy donors_banks_bank_read on public.donors_banks for select using (app.current_role() = ''blood_bank_staff'' and blood_bank_id = app.current_blood_bank_id())';
  end if;
end $$;

-- facilities: optional read-only for member orgs
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='facilities' and policyname='facilities_read_hospital'
  ) then
    execute 'create policy facilities_read_hospital on public.facilities for select using (app.current_role() = ''hospital_staff'' and id = app.current_hospital_facility_id())';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='facilities' and policyname='facilities_read_bank'
  ) then
    execute 'create policy facilities_read_bank on public.facilities for select using (app.current_role() = ''blood_bank_staff'' and id = app.current_blood_bank_facility_id())';
  end if;
end $$;

-- Done. Test matrix:
-- - Hospital staff can only CRUD blood_request for their hospital and inventory at their facility
-- - Blood bank staff can approve/read assigned requests and manage inventory at their facility, donors they manage
-- - Donors can read/update their own donor row and read their donation history
