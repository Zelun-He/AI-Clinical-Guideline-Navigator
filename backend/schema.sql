create extension if not exists vector;

create table if not exists guideline_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(3072) not null,
  source text not null,
  page_number int not null,
  created_at timestamptz not null default now()
);

create index if not exists guideline_chunks_embedding_idx
  on guideline_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create or replace function match_guideline_chunks(
  query_embedding vector(3072),
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  source text,
  page_number int,
  similarity float
)
language sql
as $$
  select
    guideline_chunks.id,
    guideline_chunks.content,
    guideline_chunks.source,
    guideline_chunks.page_number,
    1 - (guideline_chunks.embedding <=> query_embedding) as similarity
  from guideline_chunks
  order by guideline_chunks.embedding <=> query_embedding
  limit match_count;
$$;
