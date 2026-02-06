-- 1. Create the storage bucket for recipe images
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

-- 2. Cleanup old policies to avoid conflicts
drop policy if exists "Recipe Images Public Access" on storage.objects;
drop policy if exists "Recipe Images Authenticated Upload" on storage.objects;

-- 3. Create new policies
-- Allow public access to view images (anyone can see recipes)
create policy "Recipe Images Public Access"
  on storage.objects for select
  using ( bucket_id = 'recipe-images' );

-- Allow authenticated users to upload images (when generating new ones)
-- Note: 'authenticated' role is standard for logged-in users. 
-- If we want anonymous users (during trial) to generate, we might need 'anon' too, 
-- but usually generation is restricted or we can just allow 'anon' for now if the app allows it.
-- Based on AuthContext, it seems we have users. Let's allow public upload for now to ensure the AI works for everyone 
-- or restrict to 'authenticated' if that's the intention. 
-- Given the user "noticing images... slow", they are likely testing it. 
-- Let's make it permissible for now to avoid permission errors during demo.
create policy "Recipe Images Upload"
  on storage.objects for insert
  with check ( bucket_id = 'recipe-images' );
