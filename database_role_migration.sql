-- Migration to add blood_bank_admin role to the database
-- Run this in your Supabase SQL editor

-- 1. Update the CHECK constraint on profiles.role to include blood_bank_admin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'hospital_staff'::text, 'blood_bank_staff'::text, 'blood_bank_admin'::text, 'donor'::text]));

-- 2. Update the CHECK constraint on blood_inventory_audit.staff_role to include blood_bank_admin
ALTER TABLE public.blood_inventory_audit DROP CONSTRAINT IF EXISTS blood_inventory_audit_staff_role_check;

ALTER TABLE public.blood_inventory_audit 
ADD CONSTRAINT blood_inventory_audit_staff_role_check 
CHECK (staff_role = ANY (ARRAY['admin'::text, 'hospital_staff'::text, 'blood_bank_staff'::text, 'blood_bank_admin'::text, 'donor'::text]));

-- 3. Optional: Update any existing blood_bank_staff users who should be admins
-- (You'll need to identify which users should be promoted to admin)
-- UPDATE public.profiles 
-- SET role = 'blood_bank_admin' 
-- WHERE role = 'blood_bank_staff' 
-- AND user_id IN (
--     -- Add specific user IDs here that should be blood bank admins
--     -- 'uuid-of-admin-user-1',
--     -- 'uuid-of-admin-user-2'
-- );

-- 4. Verify the changes
SELECT role, COUNT(*) as count 
FROM public.profiles 
GROUP BY role 
ORDER BY role;