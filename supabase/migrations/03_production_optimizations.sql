-- 1. Create standard database indexes for Foreign Key constraints
create index if not exists idx_entries_author_id on public.entries(author_id);
create index if not exists idx_replies_entry_id on public.replies(entry_id);
create index if not exists idx_replies_author_id on public.replies(author_id);
create index if not exists idx_resonances_entry_id on public.resonances(entry_id);
create index if not exists idx_resonances_user_id on public.resonances(user_id);
create index if not exists idx_reply_resonances_reply_id on public.reply_resonances(reply_id);
create index if not exists idx_reply_resonances_user_id on public.reply_resonances(user_id);

-- 2. Create high-performance vector index for semantic search
-- HNSW is highly recommended for pgvector on production databases to scale queries
create index if not exists idx_entries_embedding on public.entries using hnsw (embedding vector_cosine_ops);

-- 3. Automatic Profile Creation Trigger on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  adjectives text[] := array['mindful', 'quiet', 'dreamy', 'thoughtful', 'silent', 'solitary', 'gentle', 'calm'];
  nouns text[] := array['scribe', 'thinker', 'walker', 'listener', 'poet', 'dreamer', 'observer', 'writer'];
  colors text[] := array['#F0706A', '#4A6FA5', '#58B19F', '#D6A2E8', '#E28743', '#2C3E50'];
  random_adj text;
  random_noun text;
  random_color text;
  random_username text;
  raw_display_name text;
begin
  random_adj := adjectives[floor(random() * 8) + 1];
  random_noun := nouns[floor(random() * 8) + 1];
  random_color := colors[floor(random() * 6) + 1];
  random_username := random_adj || '_' || random_noun || '_' || floor(100 + random() * 900)::text;
  
  raw_display_name := new.raw_user_meta_data->>'display_name';
  if raw_display_name is null or raw_display_name = '' then
    raw_display_name := coalesce(split_part(new.email, '@', 1), 'Anonymous');
  end if;

  insert into public.profiles (id, username, display_name, avatar_color)
  values (
    new.id,
    random_username,
    raw_display_name,
    random_color
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Bind trigger to auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Server-Side RPC match_entry_by_id
-- Finds semantically similar thoughts for an existing entry without sending vectors to the client.
create or replace function match_entry_by_id (
  target_entry_id uuid,
  match_threshold float,
  match_count int,
  exclude_author_id uuid
)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  author_username text,
  author_avatar_color text,
  text text,
  category text,
  tags text[],
  similarity float,
  created_at timestamptz
)
language sql stable
as $$
  with target_entry as (
    select embedding from entries where id = target_entry_id
  )
  select
    e.id,
    e.author_id,
    p.display_name as author_name,
    p.username as author_username,
    p.avatar_color as author_avatar_color,
    e.text,
    e.category,
    e.tags,
    1 - (e.embedding <=> (select embedding from target_entry)) as similarity,
    e.created_at
  from entries e
  join profiles p on e.author_id = p.id
  where e.is_private = false
    and e.id != target_entry_id
    and e.author_id != exclude_author_id
    and e.embedding is not null
    and (select embedding from target_entry) is not null
    and 1 - (e.embedding <=> (select embedding from target_entry)) > match_threshold
  order by e.embedding <=> (select embedding from target_entry)
  limit match_count;
$$;
