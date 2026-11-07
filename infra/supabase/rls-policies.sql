-- ==============================================================================
-- VULTACORE SUPABASE ROW LEVEL SECURITY (RLS) POLICIES  (hardened)
-- Run in the Supabase SQL Editor. The whole script is one transaction:
-- if any statement fails, nothing is applied. To dry-run, change the final
-- COMMIT to ROLLBACK.
--
-- STEP 0 (run this ONCE, BEFORE this script, or you will lock yourself out of
-- admin features). Admin is now decided only by app_metadata.role, which users
-- cannot edit. Then sign out and back in so your JWT carries the new claim:
--
--   update auth.users
--   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
--                           || '{"role":"admin"}'::jsonb
--   where email = '<your-admin-email>';
-- ==============================================================================

BEGIN;

-- 1. Admin check. Reads JWT claims only, so it does not need SECURITY DEFINER.
--    The old version hardcoded a personal email and ran with definer rights and
--    no fixed search_path.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- Note: policies below call (select ...) around auth.uid()/is_admin() so
-- Postgres evaluates them once per query instead of once per row.

-- ==============================================================================
-- 2. USERS TABLE (public."user")
-- ==============================================================================
ALTER TABLE IF EXISTS public."user" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public."user";
CREATE POLICY "Users can read own profile"
  ON public."user"
  FOR SELECT
  USING (
    (select auth.uid())::text = id::text
    OR (select public.is_admin())
  );

-- WITH CHECK added: without it a row could be updated into a state the user
-- would not be allowed to see. See PART B1 below: this policy alone does NOT
-- stop users from editing sensitive columns such as role or plan.
DROP POLICY IF EXISTS "Users can update own profile" ON public."user";
CREATE POLICY "Users can update own profile"
  ON public."user"
  FOR UPDATE
  USING (
    (select auth.uid())::text = id::text
    OR (select public.is_admin())
  )
  WITH CHECK (
    (select auth.uid())::text = id::text
    OR (select public.is_admin())
  );

-- service_role bypasses RLS on its own, so this policy is for admins only.
DROP POLICY IF EXISTS "Admins or service role can manage users" ON public."user";
DROP POLICY IF EXISTS "Admins can manage users" ON public."user";
CREATE POLICY "Admins can manage users"
  ON public."user"
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- ==============================================================================
-- 3. LEADS TABLE (public.lead)
-- ==============================================================================
ALTER TABLE IF EXISTS public.lead ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a lead. Open inserts invite spam: put CAPTCHA/rate limiting
-- in front of the form (your API or an Edge Function) rather than relying on RLS.
DROP POLICY IF EXISTS "Allow public lead creation" ON public.lead;
CREATE POLICY "Allow public lead creation"
  ON public.lead
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can view leads" ON public.lead;
CREATE POLICY "Only admins can view leads"
  ON public.lead
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- ==============================================================================
-- 4. SETTINGS TABLE (public.setting)
-- ==============================================================================
ALTER TABLE IF EXISTS public.setting ENABLE ROW LEVEL SECURITY;

-- VERIFY BEFORE KEEPING: this makes EVERY row readable by anyone who has your
-- (public) anon key. Run `select * from public.setting;` and confirm it holds
-- no secrets (SMTP passwords, API keys, webhook secrets). If it does, replace
-- true with a whitelist, e.g.  USING ("key" IN ('maintenance_mode'))
DROP POLICY IF EXISTS "Public can view platform settings" ON public.setting;
CREATE POLICY "Public can view platform settings"
  ON public.setting
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can update settings" ON public.setting;
CREATE POLICY "Only admins can update settings"
  ON public.setting
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- ==============================================================================
-- 5. PLANS TABLE (public.plan)
-- ==============================================================================
ALTER TABLE IF EXISTS public.plan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view plans" ON public.plan;
CREATE POLICY "Public can view plans"
  ON public.plan
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can modify plans" ON public.plan;
CREATE POLICY "Only admins can modify plans"
  ON public.plan
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- ==============================================================================
-- 6. COMMUNITY FORUM (public.post & public.comment)
-- ==============================================================================
ALTER TABLE IF EXISTS public.post ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to posts" ON public.post;
CREATE POLICY "Public read access to posts"
  ON public.post FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access to comments" ON public.comment;
CREATE POLICY "Public read access to comments"
  ON public.comment FOR SELECT USING (true);

-- Posts: the author must be the caller. Before, any logged-in user could insert
-- a post with someone else's authorId. (A NULL uid for anon makes this fail.)
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.post;
CREATE POLICY "Authenticated users can create posts"
  ON public.post FOR INSERT
  WITH CHECK ((select auth.uid())::text = "authorId"::text);

-- Comments: still only checks that the caller is logged in. See PART B2.
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comment;
CREATE POLICY "Authenticated users can create comments"
  ON public.comment FOR INSERT
  WITH CHECK ((select auth.role()) = 'authenticated');

-- WITH CHECK added so an author cannot reassign their post to another authorId.
DROP POLICY IF EXISTS "Authors or admins can update posts" ON public.post;
CREATE POLICY "Authors or admins can update posts"
  ON public.post FOR UPDATE
  USING ((select auth.uid())::text = "authorId"::text OR (select public.is_admin()))
  WITH CHECK ((select auth.uid())::text = "authorId"::text OR (select public.is_admin()));

DROP POLICY IF EXISTS "Authors or admins can delete posts" ON public.post;
CREATE POLICY "Authors or admins can delete posts"
  ON public.post FOR DELETE
  USING ((select auth.uid())::text = "authorId"::text OR (select public.is_admin()));

-- ==============================================================================
-- 7. CHAT MESSAGES (public.chat_message)
-- ==============================================================================
ALTER TABLE IF EXISTS public.chat_message ENABLE ROW LEVEL SECURITY;

-- Any logged-in user can read ALL messages. That is fine for one public room,
-- not for private/support chats. See PART B3.
DROP POLICY IF EXISTS "Authenticated users can read chat" ON public.chat_message;
CREATE POLICY "Authenticated users can read chat"
  ON public.chat_message FOR SELECT
  USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can send chat" ON public.chat_message;
CREATE POLICY "Authenticated users can send chat"
  ON public.chat_message FOR INSERT
  WITH CHECK ((select auth.role()) = 'authenticated');

-- ==============================================================================
-- 8. STORAGE BUCKET: AVATARS
-- ==============================================================================
-- Size and type limits: a public bucket will otherwise host any file type
-- (including HTML/SVG) from your Supabase domain. Adjust the limit if needed.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public URLs work without this policy; it also lets anyone LIST every avatar
-- file through the API. Remove it if your app only uses public URLs.
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
CREATE POLICY "Public avatar access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (select auth.role()) = 'authenticated'
  );

-- BUG FIXED: the old UPDATE/DELETE policies only checked "is logged in", so any
-- user could overwrite or delete anybody's avatar. Now only the uploader
-- (owner_id is set by Storage on upload) or an admin can.
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND ((select auth.uid())::text = owner_id OR (select public.is_admin()))
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND ((select auth.uid())::text = owner_id OR (select public.is_admin()))
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND ((select auth.uid())::text = owner_id OR (select public.is_admin()))
  );

-- ==============================================================================
-- PART B: NEEDS YOUR COLUMN NAMES (left commented on purpose)
-- Find them with:
--   select table_name, column_name from information_schema.columns
--   where table_schema = 'public' order by table_name, ordinal_position;
-- ==============================================================================

-- B1. Users can currently update ANY column of their own profile row,
--     including role/plan/billing fields, using only the public anon key.
--     Restrict updates to the columns that are really profile fields:
--
--   REVOKE UPDATE ON public."user" FROM anon, authenticated;
--   GRANT  UPDATE ("name", "avatarUrl") ON public."user" TO authenticated;
--
-- B2. Bind comment authors the same way posts are bound (column name assumed):
--
--   DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comment;
--   CREATE POLICY "Authenticated users can create comments"
--     ON public.comment FOR INSERT
--     WITH CHECK ((select auth.uid())::text = "authorId"::text);
--
-- B3. Stop users impersonating others in chat (and, if chats are private, limit
--     who can read them). Replace "senderId" with your real column:
--
--   DROP POLICY IF EXISTS "Authenticated users can send chat" ON public.chat_message;
--   CREATE POLICY "Authenticated users can send chat"
--     ON public.chat_message FOR INSERT
--     WITH CHECK ((select auth.uid())::text = "senderId"::text);

COMMIT;
