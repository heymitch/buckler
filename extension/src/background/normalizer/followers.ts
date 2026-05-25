// STUB — verify shapes via Phase 0 API sniffing

export interface NormalizedProfileSnapshot {
  follower_count?: number;
  connection_count?: number;
  profile_views_last_90d?: number;
  search_appearances_last_7d?: number;
}

export function normalizeFollowers(data: unknown): NormalizedProfileSnapshot {
  try {
    const d = data as Record<string, unknown>;

    return {
      follower_count: d.followerCount as number
        ?? d.numFollowers as number
        ?? (d.followerInsights as Record<string, unknown>)?.totalFollowerCount as number,
      connection_count: d.connectionCount as number,
      profile_views_last_90d: d.profileViewCount as number
        ?? (d.profileViews as Record<string, unknown>)?.allProfileViews as number,
      search_appearances_last_7d: d.searchAppearanceCount as number,
    };
  } catch {
    return {};
  }
}
