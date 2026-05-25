// STUB — verify shapes via Phase 0 API sniffing

export interface NormalizedMetrics {
  post_urn: string;
  impressions?: number;
  unique_impressions?: number;
  reactions_total?: number;
  reactions_like?: number;
  reactions_celebrate?: number;
  reactions_support?: number;
  reactions_love?: number;
  reactions_insightful?: number;
  reactions_funny?: number;
  comments?: number;
  reposts?: number;
  shares?: number;
  clicks?: number;
  video_views?: number;
  video_watch_time_seconds?: number;
}

const REACTION_MAP: Record<string, keyof NormalizedMetrics> = {
  LIKE: 'reactions_like',
  PRAISE: 'reactions_celebrate',
  EMPATHY: 'reactions_support',
  INTEREST: 'reactions_insightful',
  ENTERTAINMENT: 'reactions_funny',
  APPRECIATION: 'reactions_love',
};

export function normalizeMetrics(data: unknown): NormalizedMetrics[] {
  try {
    const d = data as Record<string, unknown>;
    const elements = (d.elements as unknown[]) ?? (Array.isArray(data) ? data as unknown[] : []);

    return elements
      .map((el: unknown): NormalizedMetrics | null => {
        try {
          const e = el as Record<string, unknown>;
          const urn = e.urn as string ?? e.entityUrn as string ?? e.postUrn as string;
          if (!urn) return null;

          const metrics: NormalizedMetrics = { post_urn: urn };

          // Direct fields
          metrics.impressions = e.impressionCount as number ?? e.numImpressions as number;
          metrics.unique_impressions = e.uniqueImpressionCount as number;
          metrics.comments = e.commentCount as number ?? e.numComments as number;
          metrics.reposts = e.repostCount as number ?? e.numShares as number;
          metrics.clicks = e.clickCount as number;

          // Reactions breakdown
          const reactions = (e.reactionsByType as Record<string, unknown>) ?? {};
          let total = 0;
          for (const [type, field] of Object.entries(REACTION_MAP)) {
            const count = (reactions[type] as number) ?? 0;
            (metrics as Record<string, unknown>)[field as string] = count;
            total += count;
          }
          metrics.reactions_total = e.totalReactionCount as number ?? total;

          // Video metrics
          metrics.video_views = e.videoViewCount as number ?? e.numViews as number;
          metrics.video_watch_time_seconds = e.videoWatchTimeSeconds as number;

          return metrics;
        } catch {
          return null;
        }
      })
      .filter((m): m is NormalizedMetrics => m !== null);
  } catch {
    return [];
  }
}
