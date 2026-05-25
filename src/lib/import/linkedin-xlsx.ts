import * as XLSX from 'xlsx';
import type { ImportResult, NormalizedPost } from './types';

const urnFrom = (v: string): string | null => {
  const m = String(v ?? '').match(/urn:li:activity:\d+/);
  return m ? m[0] : null;
};

const num = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[%,]/g, ''));
  return Number.isFinite(n) ? n : null;
};

export function parseLinkedInXlsx(buf: ArrayBuffer): ImportResult {
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets['Engagement'] ?? wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  let skipped = 0;
  const rows: NormalizedPost[] = [];

  for (const r of data) {
    const urn = urnFrom((r['Post URL'] ?? r['Post link'] ?? '') as string);
    const date = (r['Created date'] ?? r['Date'] ?? '') as string;
    if (!urn && !date) { skipped++; continue; }

    const er = num(r['Engagement rate']);
    rows.push({
      liPostUrn: urn,
      text: (r['Post title'] ?? r['Text'] ?? null) as string | null,
      publishedAt: date || null,
      postType: (r['Post type'] ?? null) as string | null,
      impressions: num(r['Impressions']),
      membersReached: num(r['Unique impressions'] ?? r['Members reached']),
      reactions: num(r['Reactions']),
      comments: num(r['Comments']),
      reposts: num(r['Reposts']),
      shares: num(r['Shares']),
      engagementRate: er != null && er < 1 ? er * 100 : er,
      profileViews: null,
      followersGained: null,
      saves: null,
      sends: null,
      source: 'linkedin_xlsx',
    });
  }

  return { rows, skipped };
}
