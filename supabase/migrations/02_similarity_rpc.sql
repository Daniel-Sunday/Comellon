create or replace function match_entries (
  query_embedding vector(768), -- Updated for Gemini 768-dimensional embeddings
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
  select
    e.id,
    e.author_id,
    p.display_name as author_name,
    p.username as author_username,
    p.avatar_color as author_avatar_color,
    e.text,
    e.category,
    e.tags,
    1 - (e.embedding <=> query_embedding) as similarity,
    e.created_at
  from entries e
  join profiles p on e.author_id = p.id
  where e.is_private = false
    and e.author_id != exclude_author_id
    and 1 - (e.embedding <=> query_embedding) > match_threshold
  order by e.embedding <=> query_embedding
  limit match_count;
$$;
