export interface EndpointMatch {
  type: 'profile_identity' | 'posts' | 'post_metrics' | 'post_demographics' | 'profile_snapshot' | 'unknown';
  priority: number; // higher = more important to capture
}

const PATTERNS: Array<{ re: RegExp; type: EndpointMatch['type']; priority: number }> = [
  // Profile identity — fired on page load
  { re: /\/voyager\/api\/identity\/dash\/profiles\?/, type: 'profile_identity', priority: 10 },
  { re: /\/voyager\/api\/me(\?|$)/, type: 'profile_identity', priority: 10 },

  // Posts feed (profile's own posts)
  { re: /\/voyager\/api\/identity\/dash\/profileUpdates/, type: 'posts', priority: 9 },
  { re: /\/voyager\/api\/feed\/dash\/profileUpdates/, type: 'posts', priority: 9 },

  // Post analytics (shown on analytics overlay / analytics page)
  { re: /\/voyager\/api\/contentcreation\/postAnalytics/, type: 'post_metrics', priority: 8 },
  { re: /\/voyager\/api\/feed\/dash\/postAnalytics/, type: 'post_metrics', priority: 8 },
  { re: /\/voyager\/api\/analytics\/ugcPostViews/, type: 'post_metrics', priority: 8 },

  // Demographics (audience breakdown on analytics)
  { re: /\/voyager\/api\/contentcreation\/audienceInsights/, type: 'post_demographics', priority: 7 },
  { re: /\/voyager\/api\/feed\/dash\/audienceInsights/, type: 'post_demographics', priority: 7 },
  { re: /\/voyager\/api\/analytics\/audienceInsights/, type: 'post_demographics', priority: 7 },

  // Follower / profile-level metrics
  { re: /\/voyager\/api\/identity\/dash\/profileFollowerInsights/, type: 'profile_snapshot', priority: 6 },
  { re: /\/voyager\/api\/identity\/dash\/followingActivityInsights/, type: 'profile_snapshot', priority: 6 },
  { re: /\/voyager\/api\/analytics\/followMetrics/, type: 'profile_snapshot', priority: 6 },
  { re: /\/voyager\/api\/identity\/dash\/profileViewers/, type: 'profile_snapshot', priority: 5 },
];

export function matchEndpoint(url: string): EndpointMatch {
  for (const p of PATTERNS) {
    if (p.re.test(url)) {
      return { type: p.type, priority: p.priority };
    }
  }
  return { type: 'unknown', priority: 0 };
}
