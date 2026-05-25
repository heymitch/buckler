import { matchEndpoint } from './endpoints.js';
import { normalizeProfile, extractPersonUrn } from './profiles.js';
import { normalizePosts } from './posts.js';
import { normalizeMetrics } from './metrics.js';
import { normalizeDemographics } from './demographics.js';
import { normalizeFollowers } from './followers.js';

export interface NormalizedCapture {
  payload_type: 'profile_identity' | 'posts' | 'post_metrics' | 'post_demographics' | 'profile_snapshot';
  data: unknown;
  profile_urn?: string; // extracted if found in this payload
}

export function normalize(url: string, raw: unknown): NormalizedCapture | null {
  const match = matchEndpoint(url);
  if (match.type === 'unknown') return null;

  try {
    switch (match.type) {
      case 'profile_identity': {
        const profile = normalizeProfile(url, raw);
        const urn = extractPersonUrn(url, raw);
        if (!profile && !urn) return null;
        return { payload_type: 'profile_identity', data: profile, profile_urn: urn ?? undefined };
      }
      case 'posts': {
        const posts = normalizePosts(raw);
        if (!posts.length) return null;
        return { payload_type: 'posts', data: posts };
      }
      case 'post_metrics': {
        const metrics = normalizeMetrics(raw);
        if (!metrics.length) return null;
        return { payload_type: 'post_metrics', data: metrics };
      }
      case 'post_demographics': {
        const demos = normalizeDemographics(raw);
        if (!demos.length) return null;
        return { payload_type: 'post_demographics', data: demos };
      }
      case 'profile_snapshot': {
        const snapshot = normalizeFollowers(raw);
        return { payload_type: 'profile_snapshot', data: snapshot };
      }
    }
  } catch {
    return null;
  }
}
