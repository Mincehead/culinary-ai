-- 1. Add image_url column to reviews table (Safe to run multiple times)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'reviews' and column_name = 'image_url') then
        alter table public.reviews add column image_url text;
    end if;
end $$;

-- 2. Create the storage bucket (Safe to run multiple times)
insert into storage.buckets (id, name, public)
values ('review-images', 'review-images', true)
on conflict (id) do nothing;

-- 3. Cleanup old/generic policies if they exist (to avoid conflicts)
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Upload" on storage.objects;

-- 4. Create new, specifically named policies
-- Allow public access to view images in this bucket
drop policy if exists "Review Images Access" on storage.objects;
create policy "Review Images Access"
  on storage.objects for select
  using ( bucket_id = 'review-images' );

-- Allow public upload to this bucket
drop policy if exists "Review Images Upload" on storage.objects;
create policy "Review Images Upload"
  on storage.objects for insert
  with check ( bucket_id = 'review-images' );
