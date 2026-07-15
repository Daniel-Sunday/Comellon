-- Enable vector extension
create extension if not exists vector;

-- Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  avatar_color text not null default '#F0706A',
  bio text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Entries (Thoughts) Table
create table public.entries (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  text text not null check (char_length(text) <= 1000),
  is_private boolean default false not null,
  category text,
  tags text[],
  embedding vector(768), -- Dimension based on Google Gemini text-embedding-004
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Replies Table
create table public.replies (
  id uuid default gen_random_uuid() primary key,
  entry_id uuid references public.entries(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  text text not null check (char_length(text) <= 1000),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Thought Resonances (Reactions)
create table public.resonances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  entry_id uuid references public.entries(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, entry_id)
);

-- Reply Resonances
create table public.reply_resonances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reply_id uuid references public.replies(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, reply_id)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.replies enable row level security;
alter table public.resonances enable row level security;
alter table public.reply_resonances enable row level security;

-- Set up basic RLS Policies

-- Profiles Policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

-- Entries (Thoughts) Policies
create policy "Public entries are viewable by everyone." on public.entries
  for select using (not is_private or auth.uid() = author_id);

create policy "Users can insert their own entries." on public.entries
  for insert with check (auth.uid() = author_id);

create policy "Users can update their own entries." on public.entries
  for update using (auth.uid() = author_id);

create policy "Users can delete their own entries." on public.entries
  for delete using (auth.uid() = author_id);

-- Replies Policies
create policy "Replies are viewable by everyone." on public.replies
  for select using (true);

create policy "Users can insert their own replies." on public.replies
  for insert with check (auth.uid() = author_id);

create policy "Users can delete their own replies." on public.replies
  for delete using (auth.uid() = author_id);

-- Resonances Policies
create policy "Resonances are viewable by everyone." on public.resonances
  for select using (true);

create policy "Users can insert their own resonances." on public.resonances
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own resonances." on public.resonances
  for delete using (auth.uid() = user_id);

-- Reply Resonances Policies
create policy "Reply resonances are viewable by everyone." on public.reply_resonances
  for select using (true);

create policy "Users can insert their own reply resonances." on public.reply_resonances
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own reply resonances." on public.reply_resonances
  for delete using (auth.uid() = user_id);
