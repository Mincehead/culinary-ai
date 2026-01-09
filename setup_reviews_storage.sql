-- Add image_url column if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'reviews' and column_name = 'image_url') then
        alter table public.reviews add column image_url text;
    end if;
end $$;

-- Create storage bucket for review images if not exists
insert into storage.buckets (id, name, public)
values ('review-images', 'review-images', true)
on conflict (id) do nothing;

-- Policy: Public can view images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'review-images' );

-- Policy: Everyone can upload images (simplifies UX, matches public review logic)
-- Note: In a stricter app, we would restrict to authenticated users only
create policy "Public Upload"
  on storage.objects for insert
  with check ( bucket_id = 'review-images' );
