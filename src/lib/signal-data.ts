// Client-safe data-access layer for the Signal dashboard.
// Each loader returns data in the EXACT shape the page's former MOCK constant used,
// so wiring is a mechanical swap. Loaders take (supabase, profileId).

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Shared shapes (mirror the former MOCK constants) ──────────────────────────
export interface FollowerGrowthPoint {
  date: string; // 'Mar 10' style label
  followers: number;
}
export interface PostsPerWeekPoint {
  week: string; // 'Mar W1' style label
  posts: number;
}
export interface TopPost {
  id: string;
  snippet: string;
  impressions: number;
  engagement: number;
  published: string; // 'YYYY-MM-DD'
}
export interface OverviewData {
  followerGrowth: FollowerGrowthPoint[];
  postsPerWeek: PostsPerWeekPoint[];
  topPosts: TopPost[];
  // header KPIs
  totalFollowers: number;
  followerDelta90d: number;
  postsLast30: number;
  postsLast60: number;
  postsLast90: number;
  impressionsLast30: number;
  impressionsLast60: number;
  impressionsLast90: number;
  impressionsDeltaPct30: number;
  impressionsDeltaPct60: number;
  impressionsDeltaPct90: number;
  avgEngagementLast30: number;
}

export interface PostRow {
  id: string;
  snippet: string;
  type: string; // lowercased post_type
  published: string; // 'YYYY-MM-DD'
  impressions: number;
  comments: number;
  engagement: number;
  reactions: number;
}

export interface AudienceBar {
  name: string;
  count: number;
}
export interface AudienceData {
  job_titles: AudienceBar[];
  industries: AudienceBar[];
  locations: AudienceBar[];
}

export interface DemoRow {
  value: string;
  pct: number;
}
export interface PostDetailData {
  id: string;
  commentary: string;
  published: string;
  type: string;
  impressions: number;
  engagement: number;
  reactions_total: number;
  comments: number;
  reposts: number;
  // derived demographics from profile-level audience_demographics
  demographics: {
    job_title: DemoRow[];
    industry: DemoRow[];
    location: DemoRow[];
  };
}

export interface HealthData {
  lastCapture: string | null; // ISO ts of most recent captured post, or null
  events: {
    ts: string;
    endpoint: string;
    status: string;
    records: number;
  }[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function monthDayLabel(isoDate: string): string {
  // 'Mar 10' style — parse the date in UTC to avoid TZ drift on date-only strings.
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function ymd(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function truncate(text: string | null, max = 80): string {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

// Bucket posts into 'Mon Wn' labels by week-of-month, ordered chronologically.
function bucketPostsPerWeek(publishedDates: string[]): PostsPerWeekPoint[] {
  const counts = new Map<string, { label: string; sort: number; posts: number }>();
  for (const iso of publishedDates) {
    if (!iso) continue;
    const d = new Date(iso);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth(); // 0-11
    const weekOfMonth = Math.floor((d.getUTCDate() - 1) / 7) + 1; // 1..5
    const key = `${year}-${month}-${weekOfMonth}`;
    const monLabel = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const label = `${monLabel} W${weekOfMonth}`;
    const sort = year * 100 + month * 10 + weekOfMonth;
    const existing = counts.get(key);
    if (existing) existing.posts += 1;
    else counts.set(key, { label, sort, posts: 1 });
  }
  return [...counts.values()].sort((a, b) => a.sort - b.sort).map(({ label, posts }) => ({ week: label, posts }));
}

// ─── Active profile ──────────────────────────────────────────────────────────────
export async function getActiveProfileId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from('signal_profiles')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0].id as string;
}

// ─── Overview ──────────────────────────────────────────────────────────────────
export async function getOverviewData(
  supabase: SupabaseClient,
  profileId: string,
): Promise<OverviewData> {
  const [snapsRes, postsRes] = await Promise.all([
    supabase
      .from('signal_follower_snapshots')
      .select('date, follower_count')
      .eq('profile_id', profileId)
      .order('date', { ascending: true }),
    supabase
      .from('signal_posts')
      .select('id, text, published_at, impressions, engagement_rate')
      .eq('profile_id', profileId)
      .order('published_at', { ascending: true }),
  ]);

  const snaps = (snapsRes.data ?? []) as { date: string; follower_count: number }[];
  const posts = (postsRes.data ?? []) as {
    id: string;
    text: string | null;
    published_at: string | null;
    impressions: number | null;
    engagement_rate: number | null;
  }[];

  // Follower growth chart
  const followerGrowth: FollowerGrowthPoint[] = snaps.map((s) => ({
    date: monthDayLabel(s.date),
    followers: s.follower_count,
  }));

  // Posts per week chart
  const postsPerWeek = bucketPostsPerWeek(
    posts.map((p) => p.published_at).filter((d): d is string => !!d),
  );

  // Top posts (by impressions desc, top 5)
  const topPosts: TopPost[] = [...posts]
    .sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      snippet: truncate(p.text, 60),
      impressions: p.impressions ?? 0,
      engagement: p.engagement_rate ?? 0,
      published: p.published_at ? ymd(p.published_at) : '',
    }));

  // ── KPIs ──
  const totalFollowers = snaps.length ? snaps[snaps.length - 1].follower_count : 0;

  const now = Date.now();
  const dayMs = 86_400_000;
  const follower90Floor = now - 90 * dayMs;
  const within90 = snaps.filter((s) => new Date(s.date).getTime() >= follower90Floor);
  const followerDelta90d =
    within90.length >= 1 && snaps.length
      ? totalFollowers - within90[0].follower_count
      : 0;

  function postWindow(days: number) {
    const floor = now - days * dayMs;
    const priorFloor = now - 2 * days * dayMs;
    const inWindow = posts.filter(
      (p) => p.published_at && new Date(p.published_at).getTime() >= floor,
    );
    const inPrior = posts.filter(
      (p) =>
        p.published_at &&
        new Date(p.published_at).getTime() >= priorFloor &&
        new Date(p.published_at).getTime() < floor,
    );
    const impressions = inWindow.reduce((s, p) => s + (p.impressions ?? 0), 0);
    const priorImpressions = inPrior.reduce((s, p) => s + (p.impressions ?? 0), 0);
    const deltaPct =
      priorImpressions > 0
        ? Math.round(((impressions - priorImpressions) / priorImpressions) * 100)
        : 0;
    return { count: inWindow.length, impressions, deltaPct };
  }

  const w30 = postWindow(30);
  const w60 = postWindow(60);
  const w90 = postWindow(90);

  // Avg engagement over last 30 posts (by recency)
  const last30 = [...posts]
    .sort(
      (a, b) =>
        new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime(),
    )
    .slice(0, 30);
  const engVals = last30.map((p) => p.engagement_rate ?? 0).filter((v) => v > 0);
  const avgEngagementLast30 = engVals.length
    ? Math.round((engVals.reduce((s, v) => s + v, 0) / engVals.length) * 10) / 10
    : 0;

  return {
    followerGrowth,
    postsPerWeek,
    topPosts,
    totalFollowers,
    followerDelta90d,
    postsLast30: w30.count,
    postsLast60: w60.count,
    postsLast90: w90.count,
    impressionsLast30: w30.impressions,
    impressionsLast60: w60.impressions,
    impressionsLast90: w90.impressions,
    impressionsDeltaPct30: w30.deltaPct,
    impressionsDeltaPct60: w60.deltaPct,
    impressionsDeltaPct90: w90.deltaPct,
    avgEngagementLast30,
  };
}

// ─── Posts list ──────────────────────────────────────────────────────────────────
export async function getPostsData(
  supabase: SupabaseClient,
  profileId: string,
): Promise<PostRow[]> {
  const { data } = await supabase
    .from('signal_posts')
    .select('id, text, post_type, published_at, impressions, comments, engagement_rate, reactions')
    .eq('profile_id', profileId)
    .order('impressions', { ascending: false });

  const rows = (data ?? []) as {
    id: string;
    text: string | null;
    post_type: string | null;
    published_at: string | null;
    impressions: number | null;
    comments: number | null;
    engagement_rate: number | null;
    reactions: number | null;
  }[];

  return rows.map((p) => ({
    id: p.id,
    snippet: truncate(p.text, 80),
    type: (p.post_type ?? 'text').toLowerCase(),
    published: p.published_at ? ymd(p.published_at) : '',
    impressions: p.impressions ?? 0,
    comments: p.comments ?? 0,
    engagement: p.engagement_rate ?? 0,
    reactions: p.reactions ?? 0,
  }));
}

// ─── Audience ────────────────────────────────────────────────────────────────────
export async function getAudienceData(
  supabase: SupabaseClient,
  profileId: string,
): Promise<AudienceData> {
  const { data } = await supabase
    .from('signal_audience_demographics')
    .select('dimension, value, count')
    .eq('profile_id', profileId)
    .order('count', { ascending: false });

  const rows = (data ?? []) as { dimension: string; value: string; count: number }[];
  const pick = (dim: string): AudienceBar[] =>
    rows
      .filter((r) => r.dimension === dim)
      .map((r) => ({ name: r.value, count: r.count }));

  return {
    job_titles: pick('job_title'),
    industries: pick('industry'),
    locations: pick('location'),
  };
}

// ─── Post detail ─────────────────────────────────────────────────────────────────
export async function getPostDetailData(
  supabase: SupabaseClient,
  profileId: string,
  postId: string,
): Promise<PostDetailData | null> {
  const { data, error } = await supabase
    .from('signal_posts')
    .select(
      'id, text, post_type, published_at, impressions, engagement_rate, reactions, comments, reposts',
    )
    .eq('profile_id', profileId)
    .eq('id', postId)
    .maybeSingle();

  if (error || !data) return null;
  const p = data as {
    id: string;
    text: string | null;
    post_type: string | null;
    published_at: string | null;
    impressions: number | null;
    engagement_rate: number | null;
    reactions: number | null;
    comments: number | null;
    reposts: number | null;
  };

  // Profile-level demographics as a stand-in for per-post demographics (schema has no per-post dim).
  const { data: demoRows } = await supabase
    .from('signal_audience_demographics')
    .select('dimension, value, count')
    .eq('profile_id', profileId)
    .order('count', { ascending: false });

  const demos = (demoRows ?? []) as { dimension: string; value: string; count: number }[];
  function asPct(dim: string): DemoRow[] {
    const subset = demos.filter((d) => d.dimension === dim).slice(0, 5);
    const total = subset.reduce((s, d) => s + d.count, 0);
    return subset.map((d) => ({
      value: d.value,
      pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
    }));
  }

  return {
    id: p.id,
    commentary: p.text ?? '',
    published: p.published_at ? ymd(p.published_at) : '',
    type: (p.post_type ?? 'text').toLowerCase(),
    impressions: p.impressions ?? 0,
    engagement: p.engagement_rate ?? 0,
    reactions_total: p.reactions ?? 0,
    comments: p.comments ?? 0,
    reposts: p.reposts ?? 0,
    demographics: {
      job_title: asPct('job_title'),
      industry: asPct('industry'),
      location: asPct('location'),
    },
  };
}

// ─── Health ──────────────────────────────────────────────────────────────────────
export async function getHealthData(
  supabase: SupabaseClient,
  profileId: string,
): Promise<HealthData> {
  // Derive a capture event log from recent posts (source + captured_at).
  const { data } = await supabase
    .from('signal_posts')
    .select('captured_at, source, post_type')
    .eq('profile_id', profileId)
    .order('captured_at', { ascending: false })
    .limit(10);

  const rows = (data ?? []) as { captured_at: string; source: string; post_type: string | null }[];
  const lastCapture = rows.length ? rows[0].captured_at : null;

  const events = rows.map((r) => ({
    ts: r.captured_at,
    endpoint: r.source,
    status: 'success',
    records: 1,
  }));

  return { lastCapture, events };
}
