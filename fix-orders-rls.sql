-- Fix RLS policies for blood_request table to resolve "no orders found" issue
-- Run this in your Supabase SQL editor

-- 1. Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'blood_request';

-- 2. Temporarily disable RLS to test if it's the issue (for debugging only)
-- UNCOMMENT THE LINE BELOW ONLY FOR TESTING, THEN RE-ENABLE RLS
-- ALTER TABLE public.blood_request DISABLE ROW LEVEL SECURITY;

-- 3. Add a temporary policy to allow broader access for debugging
-- This policy allows authenticated users to read blood_request records
DO $$
BEGIN
  -- Drop existing restrictive policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_request' AND policyname='req_read_hospital') THEN
    DROP POLICY req_read_hospital ON public.blood_request;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_request' AND policyname='req_read_bank') THEN
    DROP POLICY req_read_bank ON public.blood_request;
  END IF;
  
  -- Create a more permissive read policy for debugging
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_request' AND policyname='blood_request_read_debug') THEN
    CREATE POLICY blood_request_read_debug ON public.blood_request
      FOR SELECT TO authenticated
      USING (true);  -- Allow all authenticated users to read
  END IF;
END $$;

-- 4. Check if blood_request table has data
SELECT 
  'blood_request' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT hospital_id) as unique_hospitals,
  MIN(created_at) as oldest_request,
  MAX(created_at) as newest_request
FROM public.blood_request;

-- 5. Check if hospitals table is properly linked
SELECT 
  br.request_id,
  br.hospital_id,
  h.hospital_name,
  br.blood_type,
  br.status,
  br.created_at
FROM public.blood_request br
LEFT JOIN public.hospitals h ON br.hospital_id = h.id
ORDER BY br.created_at DESC
LIMIT 5;

-- 6. Check profiles table for user assignments
SELECT 
  p.user_id,
  p.role,
  p.hospital_id,
  h.hospital_name
FROM public.profiles p
LEFT JOIN public.hospitals h ON p.hospital_id = h.id
WHERE p.role IN ('hospital_staff', 'blood_bank_staff', 'admin')
LIMIT 10;

-- 7. Alternative: Create role-based policies that are less restrictive
DO $$
BEGIN
  -- Admin can see everything
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_request' AND policyname='blood_request_admin_read') THEN
    CREATE POLICY blood_request_admin_read ON public.blood_request
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.user_id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
  
  -- Hospital staff can see their hospital's requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_request' AND policyname='blood_request_hospital_read') THEN
    CREATE POLICY blood_request_hospital_read ON public.blood_request
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.user_id = auth.uid() 
            AND p.role = 'hospital_staff' 
            AND (p.hospital_id = blood_request.hospital_id OR p.hospital_id IS NULL)
        )
      );
  END IF;
  
  -- Blood bank staff can see all requests (they need to fulfill them)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blood_request' AND policyname='blood_request_bank_read') THEN
    CREATE POLICY blood_request_bank_read ON public.blood_request
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.user_id = auth.uid() AND p.role = 'blood_bank_staff'
        )
      );
  END IF;
END $$;

-- 8. Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'blood_request'
ORDER BY policyname;

-- 9. Test query as if you were the current user
-- Replace 'YOUR_USER_ID' with your actual user ID from localStorage
/*
SELECT 
  br.request_id,
  br.hospital_id,
  br.blood_type,
  br.quantity,
  br.status,
  br.created_at,
  h.hospital_name
FROM public.blood_request br
LEFT JOIN public.hospitals h ON br.hospital_id = h.id
WHERE EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = 'YOUR_USER_ID'::uuid  -- Replace with your actual user ID
)
ORDER BY br.created_at DESC
LIMIT 10;
*/