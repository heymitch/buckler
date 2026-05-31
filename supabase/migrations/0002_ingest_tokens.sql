create table signal_ingest_tokens (
  token uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references signal_profiles(id) on delete cascade,
  label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
alter table signal_ingest_tokens enable row level security;
create policy "own signal_ingest_tokens" on signal_ingest_tokens
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
