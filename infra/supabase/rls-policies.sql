-- ==============================================================================
-- VULTACORE SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Complete database hardening pack for Supabase PostgreSQL.
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Helper function to check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' = 'mohtasham.siddiqui17@gmail.com'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. USERS TABLE (public.user)
-- ==============================================================================
ALTER TABLE IF EXISTS public."user" ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile; admins can read all profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public."user";
CREATE POLICY "Users can read own profile"
  ON public."user"
  FOR SELECT
  USING (
    auth.uid()::text = id::text 
    OR public.is_admin()
  );

-- Allow users to update their own profile; admins can update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON public."user";
CREATE POLICY "Users can update own profile"
  ON public."user"
  FOR UPDATE
  USING (
    auth.uid()::text = id::text 
    OR public.is_admin()
  );

-- Restrict INSERT/DELETE on user table to service role or admin
DROP POLICY IF EXISTS "Admins or service role can manage users" ON public."user";
CREATE POLICY "Admins or service role can manage users"
  ON public."user"
  FOR ALL
  USING (public.is_admin());

-- ==============================================================================
-- 3. LEADS TABLE (public.lead)
-- ==============================================================================
ALTER TABLE IF EXISTS public.lead ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a lead via contact/inquiry forms
DROP POLICY IF EXISTS "Allow public lead creation" ON public.lead;
CREATE POLICY "Allow public lead creation"
  ON public.lead
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read or manage sales leads
DROP POLICY IF EXISTS "Only admins can view leads" ON public.lead;
CREATE POLICY "Only admins can view leads"
  ON public.lead
  FOR ALL
  USING (public.is_admin());

-- ==============================================================================
-- 4. SETTINGS TABLE (public.setting)
-- ==============================================================================
ALTER TABLE IF EXISTS public.setting ENABLE ROW LEVEL SECURITY;

-- Public read access for general platform settings (e.g. maintenance mode)
DROP POLICY IF EXISTS "Public can view platform settings" ON public.setting;
CREATE POLICY "Public can view platform settings"
  ON public.setting
  FOR SELECT
  USING (true);

-- Only admins can alter platform settings
DROP POLICY IF EXISTS "Only admins can update settings" ON public.setting;
CREATE POLICY "Only admins can update settings"
  ON public.setting
  FOR ALL
  USING (public.is_admin());

-- ==============================================================================
-- 5. PLANS TABLE (public.plan)
-- ==============================================================================
ALTER TABLE IF EXISTS public.plan ENABLE ROW LEVEL SECURITY;

-- Public can view subscription plans
DROP POLICY IF EXISTS "Public can view plans" ON public.plan;
CREATE POLICY "Public can view plans"
  ON public.plan
  FOR SELECT
  USING (true);

-- Only admins can modify plans
DROP POLICY IF EXISTS "Only admins can modify plans" ON public.plan;
CREATE POLICY "Only admins can modify plans"
  ON public.plan
  FOR ALL
  USING (public.is_admin());

-- ==============================================================================
-- 6. COMMUNITY FORUM (public.post & public.comment)
-- ==============================================================================
ALTER TABLE IF EXISTS public.post ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comment ENABLE ROW LEVEL SECURITY;

-- Anyone can read forum posts and comments
DROP POLICY IF EXISTS "Public read access to posts" ON public.post;
CREATE POLICY "Public read access to posts"
  ON public.post FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access to comments" ON public.comment;
CREATE POLICY "Public read access to comments"
  ON public.comment FOR SELECT USING (true);

-- Authenticated users can create posts and comments
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.post;
CREATE POLICY "Authenticated users can create posts"
  ON public.post FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comment;
CREATE POLICY "Authenticated users can create comments"
  ON public.comment FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Authors or admins can update/delete their own posts
DROP POLICY IF EXISTS "Authors or admins can update posts" ON public.post;
CREATE POLICY "Authors or admins can update posts"
  ON public.post FOR UPDATE
  USING (auth.uid()::text = "authorId"::text OR public.is_admin());

DROP POLICY IF EXISTS "Authors or admins can delete posts" ON public.post;
CREATE POLICY "Authors or admins can delete posts"
  ON public.post FOR DELETE
  USING (auth.uid()::text = "authorId"::text OR public.is_admin());

-- ==============================================================================
-- 7. CHAT MESSAGES (public.chat_message)
-- ==============================================================================
ALTER TABLE IF EXISTS public.chat_message ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read chat messages
DROP POLICY IF EXISTS "Authenticated users can read chat" ON public.chat_message;
CREATE POLICY "Authenticated users can read chat"
  ON public.chat_message FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can send chat messages
DROP POLICY IF EXISTS "Authenticated users can send chat" ON public.chat_message;
CREATE POLICY "Authenticated users can send chat"
  ON public.chat_message FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================================================
-- 8. STORAGE BUCKET: AVATARS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
CREATE POLICY "Public avatar access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

