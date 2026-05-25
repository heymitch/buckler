import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseLinkedInXlsx } from '../../src/lib/import/linkedin-xlsx';

function buildBook(rows: Record<string, unknown>[]): ArrayBuffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Engagement');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

describe('parseLinkedInXlsx', () => {
  it('maps LinkedIn creator-analytics rows to NormalizedPost', () => {
    const buf = buildBook([
      { 'Post URL': 'urn:li:activity:7200', 'Created date': '2026-05-02',
        'Impressions': 17600, 'Reactions': 500, 'Comments': 30, 'Reposts': 8, 'Engagement rate': 0.068 },
    ]);
    const { rows } = parseLinkedInXlsx(buf);
    expect(rows[0]).toMatchObject({
      liPostUrn: 'urn:li:activity:7200',
      impressions: 17600,
      reactions: 500,
      source: 'linkedin_xlsx',
    });
  });

  it('normalizes a fractional engagement rate (0.068) to percent (6.8)', () => {
    const buf = buildBook([{ 'Post URL': 'urn:li:activity:1', 'Created date': '2026-01-01', 'Engagement rate': 0.068 }]);
    const { rows } = parseLinkedInXlsx(buf);
    expect(rows[0].engagementRate).toBeCloseTo(6.8, 5);
  });
});
