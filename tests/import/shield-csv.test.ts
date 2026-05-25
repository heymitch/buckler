import { describe, it, expect } from 'vitest';
import { parseShieldCsv } from '../../src/lib/import/shield-csv';

const SAMPLE = `Post URL,Date,Post Type,Impressions,Reactions,Comments,Reposts,Engagement Rate
https://www.linkedin.com/feed/update/urn:li:activity:7123,2026-04-28,Text,24800,840,73,21,8.4%
https://www.linkedin.com/feed/update/urn:li:activity:7124,2026-04-21,Image,19200,610,40,12,7.1%`;

describe('parseShieldCsv', () => {
  it('maps Shield columns to NormalizedPost', () => {
    const { rows, skipped } = parseShieldCsv(SAMPLE);
    expect(skipped).toBe(0);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      liPostUrn: 'urn:li:activity:7123',
      publishedAt: '2026-04-28',
      postType: 'Text',
      impressions: 24800,
      reactions: 840,
      comments: 73,
      reposts: 21,
      engagementRate: 8.4,
      source: 'shield_csv',
    });
  });

  it('skips rows with neither URL nor date', () => {
    const { rows, skipped } = parseShieldCsv('Post URL,Date\n,\nhttps://x/urn:li:activity:9,2026-01-01');
    expect(rows).toHaveLength(1);
    expect(skipped).toBe(1);
  });
});
