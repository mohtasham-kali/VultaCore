-- VULTACORE STORAGE INITIALIZATION SQL
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create the 'avatars' bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Set up Access Policies

-- Allow Public Access (View anyone's avatar)
create policy "Avatar Public Access"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow Authenticated Uploads
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

-- Allow Users to update their own files
create policy "Users can update their own avatar"
  on storage.objects for update
  using ( 
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow Users to delete their own files
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using ( 
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
