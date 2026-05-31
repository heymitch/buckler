-- Run AFTER signing in once (needs a row in auth.users). Apply via:
--   psql <conn> -f supabase/seed-demo.sql  OR paste into Supabase SQL editor.

-- ── Idempotent reset ───────────────────────────────────────────────────────────
delete from buckler_profiles where name = 'Demo Creator';

-- ── Insert profile ─────────────────────────────────────────────────────────────
with new_profile as (
  insert into buckler_profiles (owner_user_id, li_urn, name, headline)
  values (
    (select id from auth.users order by created_at limit 1),
    'urn:li:person:demoCreator123',
    'Demo Creator',
    'AI ghostwriter | building in public'
  )
  returning id
),

-- ── Insert posts ───────────────────────────────────────────────────────────────
new_posts as (
  insert into buckler_posts (
    profile_id, li_post_urn, text, published_at, post_type,
    impressions, members_reached, reactions, comments, reposts, shares,
    engagement_rate, profile_views, followers_gained, saves, sends, source
  )
  select
    p.id,
    d.li_post_urn, d.text, d.published_at::timestamptz, d.post_type,
    d.impressions, d.members_reached, d.reactions, d.comments, d.reposts, d.shares,
    d.engagement_rate, d.profile_views, d.followers_gained, d.saves, d.sends,
    'shield_csv'
  from new_profile p
  cross join (values
    ('urn:li:activity:8100000000000001', 'Stop outsourcing your thinking. AI is a tool, not a ghostwriter.',        '2026-03-02', 'Text',     28400, 19200, 1120, 87, 34, 12, 6.2, 340, 18, 56, 210),
    ('urn:li:activity:8100000000000002', 'I mapped every AI tool I use daily onto one slide. Here''s the breakdown.','2026-03-10', 'Image',    22100, 15600,  840, 61, 28,  9, 5.8, 290, 14, 48, 175),
    ('urn:li:activity:8100000000000003', 'Watch me build a client deliverable in 22 minutes using Claude + Notion.', '2026-03-18', 'Video',    30000, 21400, 1380,112, 52, 18, 7.4, 410, 22, 74, 310),
    ('urn:li:activity:8100000000000004', 'The 6-step framework I use to onboard AI into any team. Swipe →',          '2026-03-24', 'Document', 18700, 13100,  690, 44, 19,  7, 5.1, 240, 11, 39, 148),
    ('urn:li:activity:8100000000000005', 'Hot take: prompt engineering is a temporary skill. Taste is forever.',      '2026-04-03', 'Text',     25300, 17800, 1050, 95, 41, 14, 6.7, 320, 16, 61, 225),
    ('urn:li:activity:8100000000000006', 'My content workflow went from 8 hours to 90 minutes. Thread ↓',             '2026-04-11', 'Image',    19900, 14200,  760, 58, 24,  8, 5.4, 270, 13, 44, 162),
    ('urn:li:activity:8100000000000007', 'The reason most AI agents fail is simpler than you think.',                 '2026-04-18', 'Text',     15800, 10900,  580, 39, 16,  5, 4.9, 195,  9, 32, 124),
    ('urn:li:activity:8100000000000008', 'Live coding an AI assistant from scratch — no fluff, just build.',          '2026-04-26', 'Video',    26700, 18900, 1240,101, 47, 16, 7.0, 380, 20, 68, 285),
    ('urn:li:activity:8100000000000009', '3 AI workflows every solopreneur should steal. (Case studies inside)',      '2026-05-04', 'Document', 21500, 15100,  830, 65, 27,  9, 5.7, 305, 15, 51, 188),
    ('urn:li:activity:8100000000000010', 'I let an AI handle my inbox for 30 days. Here''s what happened.',           '2026-05-08', 'Image',    17200, 12000,  640, 49, 20,  7, 5.3, 220, 10, 38, 143),
    ('urn:li:activity:8100000000000011', 'Your next hire might be an AI agent. Here''s how to think about that.',     '2026-05-14', 'Text',     23100, 16400,  910, 78, 35, 11, 6.1, 300, 15, 54, 196),
    ('urn:li:activity:8100000000000012', 'The stack I''d build if I were starting my AI consulting practice today.',   '2026-05-21', 'Document', 20400, 14600,  790, 60, 25,  8, 5.5, 280, 13, 46, 168)
  ) as d(li_post_urn, text, published_at, post_type,
         impressions, members_reached, reactions, comments, reposts, shares,
         engagement_rate, profile_views, followers_gained, saves, sends)
  returning profile_id
),

-- ── Insert follower snapshots ──────────────────────────────────────────────────
new_snapshots as (
  insert into buckler_follower_snapshots (profile_id, date, follower_count)
  select
    p.id,
    d.snap_date::date,
    d.follower_count
  from new_profile p
  cross join (values
    ('2026-03-01', 4800),
    ('2026-03-08', 4920),
    ('2026-03-15', 5060),
    ('2026-03-22', 5180),
    ('2026-03-29', 5310),
    ('2026-04-05', 5490),
    ('2026-04-12', 5640),
    ('2026-04-19', 5760),
    ('2026-04-26', 5910),
    ('2026-05-03', 6080),
    ('2026-05-10', 6200)
  ) as d(snap_date, follower_count)
  returning profile_id
)

-- ── Insert audience demographics ───────────────────────────────────────────────
insert into buckler_audience_demographics (profile_id, dimension, value, count)
select p.id, d.dimension, d.value, d.count
from new_profile p
cross join (values
  -- job_title
  ('job_title', 'Founder / CEO',                   1240),
  ('job_title', 'Marketing Manager',                 870),
  ('job_title', 'Content Creator',                   610),
  ('job_title', 'Consultant',                        540),
  ('job_title', 'Product Manager',                   430),
  -- company
  ('company',   'Self-employed',                   1180),
  ('company',   'HubSpot',                           290),
  ('company',   'Salesforce',                        210),
  ('company',   'Meta',                              175),
  -- location
  ('location',  'United States',                   2100),
  ('location',  'United Kingdom',                    480),
  ('location',  'Canada',                            360),
  ('location',  'Australia',                         280),
  ('location',  'India',                             220),
  ('location',  'Germany',                           140),
  -- company_size
  ('company_size', '1 (self-employed)',              980),
  ('company_size', '2–10',                          1140),
  ('company_size', '11–50',                          670),
  ('company_size', '51–200',                         390),
  ('company_size', '201–500',                        210),
  -- industry
  ('industry', 'Marketing & Advertising',           1050),
  ('industry', 'Technology / SaaS',                  920),
  ('industry', 'Management Consulting',               560),
  ('industry', 'E-Learning & Education',              420),
  ('industry', 'Media & Publishing',                  310),
  ('industry', 'Professional Services',               240)
) as d(dimension, value, count);
