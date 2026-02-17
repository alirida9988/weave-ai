-- Run this ENTIRE script in Supabase Dashboard → SQL Editor → New query
-- Fixes "new row violates row-level security policy" for final-visuals bucket

-- Step 1: See your bucket id (run this first if upload still fails – copy the "id" value)
-- SELECT id, name, public FROM storage.buckets;

-- Step 2: Drop ALL policies we may have created (ignore errors)
DROP POLICY IF EXISTS "Allow authenticated uploads to final-visuals" ON storage.objects;
DROP POLICY IF EXISTS "final-visuals insert" ON storage.objects;
DROP POLICY IF EXISTS "final-visuals select" ON storage.objects;
DROP POLICY IF EXISTS "final-visuals update" ON storage.objects;
DROP POLICY IF EXISTS "final-visuals insert anon" ON storage.objects;
DROP POLICY IF EXISTS "final-visuals insert authenticated" ON storage.objects;
DROP POLICY IF EXISTS "final-visuals select public" ON storage.objects;

-- Step 3: Single INSERT policy for ALL roles (public = anon + authenticated)
-- Uses literal bucket id 'final-visuals' – if your bucket id is different, replace below
CREATE POLICY "final-visuals allow upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'final-visuals');

-- Step 4: Allow anyone to read (for shareable links)
CREATE POLICY "final-visuals allow read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'final-visuals');
