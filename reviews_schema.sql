-- Create the reviews table
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_name text not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  video_url text,
  platform text, -- 'youtube', 'tiktok', 'instagram'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.reviews enable row level security;

-- Policy: Everyone can view reviews
create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using ( true );

-- Policy: Only authenticated users can insert reviews (optional, but good for spam)
-- For now, allowing anyone to insert to match "User Name" field flexibility, 
-- or you can restrict this if you prefer.
create policy "Anyone can insert reviews"
  on public.reviews for insert
  with check ( true );
