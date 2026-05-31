-- buckler_profiles: LinkedIn accounts a user tracks (multi-profile)
create table buckler_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  li_urn text,
  name text not null,
  headline text,
  created_at timestamptz not null default now()
);

create table buckler_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references buckler_profiles(id) on delete cascade,
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

create table buckler_follower_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references buckler_profiles(id) on delete cascade,
  date date not null,
  follower_count int not null,
  unique (profile_id, date)
);

create table buckler_audience_demographics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references buckler_profiles(id) on delete cascade,
  dimension text not null check (dimension in ('job_title','company','location','company_size','industry')),
  value text not null,
  count int not null,
  captured_at timestamptz not null default now()
);

create table buckler_imports (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references buckler_profiles(id) on delete set null,
  source text not null,
  filename text,
  rows_imported int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS
alter table buckler_profiles enable row level security;
alter table buckler_posts enable row level security;
alter table buckler_follower_snapshots enable row level security;
alter table buckler_audience_demographics enable row level security;
alter table buckler_imports enable row level security;

create policy "own buckler_profiles" on buckler_profiles
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "own buckler_posts" on buckler_posts for all
  using (exists (select 1 from buckler_profiles p where p.id = buckler_posts.profile_id and p.owner_user_id = auth.uid()))
  with check (exists (select 1 from buckler_profiles p where p.id = buckler_posts.profile_id and p.owner_user_id = auth.uid()));

create policy "own buckler_follower_snapshots" on buckler_follower_snapshots for all
  using (exists (select 1 from buckler_profiles p where p.id = buckler_follower_snapshots.profile_id and p.owner_user_id = auth.uid()))
  with check (exists (select 1 from buckler_profiles p where p.id = buckler_follower_snapshots.profile_id and p.owner_user_id = auth.uid()));

create policy "own buckler_audience_demographics" on buckler_audience_demographics for all
  using (exists (select 1 from buckler_profiles p where p.id = buckler_audience_demographics.profile_id and p.owner_user_id = auth.uid()))
  with check (exists (select 1 from buckler_profiles p where p.id = buckler_audience_demographics.profile_id and p.owner_user_id = auth.uid()));

create policy "own buckler_imports" on buckler_imports
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
