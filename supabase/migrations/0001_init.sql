-- profiles: LinkedIn accounts a user tracks (multi-profile)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  li_urn text,
  name text not null,
  headline text,
  created_at timestamptz not null default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  li_post_urn text,
  text text,
  published_at timestamptz,
  post_type text,
  impressions int,
  members_reached int,
  reactions int,
  comments int,
  reposts int,
  shares int,
  engagement_rate numeric,
  profile_views int,
  followers_gained int,
  saves int,
  sends int,
  source text not null check (source in ('shield_csv','linkedin_xlsx','extension')),
  captured_at timestamptz not null default now(),
  unique (profile_id, li_post_urn)
);

create table follower_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  follower_count int not null,
  unique (profile_id, date)
);

create table audience_demographics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  dimension text not null check (dimension in ('job_title','company','location','company_size','industry')),
  value text not null,
  count int not null,
  captured_at timestamptz not null default now()
);

create table imports (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  source text not null,
  filename text,
  rows_imported int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS
alter table profiles enable row level security;
alter table posts enable row level security;
alter table follower_snapshots enable row level security;
alter table audience_demographics enable row level security;
alter table imports enable row level security;

create policy "own profiles" on profiles
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "own posts" on posts for all
  using (exists (select 1 from profiles p where p.id = posts.profile_id and p.owner_user_id = auth.uid()))
  with check (exists (select 1 from profiles p where p.id = posts.profile_id and p.owner_user_id = auth.uid()));

create policy "own follower_snapshots" on follower_snapshots for all
  using (exists (select 1 from profiles p where p.id = follower_snapshots.profile_id and p.owner_user_id = auth.uid()))
  with check (exists (select 1 from profiles p where p.id = follower_snapshots.profile_id and p.owner_user_id = auth.uid()));

create policy "own audience_demographics" on audience_demographics for all
  using (exists (select 1 from profiles p where p.id = audience_demographics.profile_id and p.owner_user_id = auth.uid()))
  with check (exists (select 1 from profiles p where p.id = audience_demographics.profile_id and p.owner_user_id = auth.uid()));

create policy "own imports" on imports
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
