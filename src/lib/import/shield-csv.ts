import Papa from 'papaparse';
import type { ImportResult, NormalizedPost } from './types';

const urnFromUrl = (url: string): string | null => {
  const m = url?.match(/urn:li:activity:\d+/);
  return m ? m[0] : null;
};

const num = (v: string | undefined): number | null => {
  if (v == null || v === '') return null;
  const n = parseFloat(String(v).replace(/[%,]/g, ''));
  return Number.isFinite(n) ? n : null;
};

export function parseShieldCsv(text: string): ImportResult {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  let skipped = 0;
  const rows: NormalizedPost[] = [];
  for (const r of parsed.data) {
    const urn = urnFromUrl(r['Post URL'] ?? '');
    if (!urn && !r['Date']) { skipped++; continue; }
    rows.push({
      liPostUrn: urn,
      text: r['Post Text'] ?? r['Text'] ?? null,
      publishedAt: r['Date'] ?? null,
      postType: r['Post Type'] ?? null,
      impressions: num(r['Impressions']),
      membersReached: num(r['Members Reached']),
      reactions: num(r['Reactions']),
      comments: num(r['Comments']),
      reposts: num(r['Reposts']),
      shares: num(r['Shares']),
      engagementRate: num(r['Engagement Rate']),
      profileViews: num(r['Profile Views']),
      followersGained: num(r['Followers Gained']),
      saves: num(r['Saves']),
      sends: num(r['Sends']),
      source: 'shield_csv',
    });
  }
  return { rows, skipped };
}
