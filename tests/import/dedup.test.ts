import { describe, it, expect } from 'vitest';
import { postKey } from '../../src/lib/import/dedup';
import type { NormalizedPost } from '../../src/lib/import/types';

const base: NormalizedPost = {
  liPostUrn: null, text: 'hello world', publishedAt: '2026-04-28', postType: 'Text',
  impressions: 1, membersReached: null, reactions: null, comments: null, reposts: null,
  shares: null, engagementRate: null, profileViews: null, followersGained: null,
  saves: null, sends: null, source: 'shield_csv',
};

describe('postKey', () => {
  it('uses the URN when present', () => {
    expect(postKey({ ...base, liPostUrn: 'urn:li:activity:7' })).toBe('urn:li:activity:7');
  });
  it('falls back to date+text hash when URN missing', () => {
    const k = postKey(base);
    expect(k).toMatch(/^h:/);
    expect(k).toBe(postKey({ ...base, impressions: 999 })); // metrics dont change identity
  });
});
