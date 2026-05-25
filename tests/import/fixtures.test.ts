import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseShieldCsv } from '../../src/lib/import/shield-csv';
import { parseLinkedInXlsx } from '../../src/lib/import/linkedin-xlsx';

const fx = (f: string) => join(process.cwd(), 'fixtures', f);

describe('fixture parsing', () => {
  it('parses the Shield CSV fixture', () => {
    const { rows, skipped } = parseShieldCsv(readFileSync(fx('shield-sample.csv'), 'utf8'));
    expect(rows.length).toBeGreaterThanOrEqual(10);
    expect(skipped).toBe(0);
    expect(rows[0].liPostUrn).toMatch(/^urn:li:activity:/);
    expect(rows[0].impressions).toBeGreaterThan(0);
  });
  it('parses the LinkedIn XLSX fixture', () => {
    const buf = readFileSync(fx('linkedin-sample.xlsx'));
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const { rows } = parseLinkedInXlsx(ab as ArrayBuffer);
    expect(rows.length).toBeGreaterThanOrEqual(8);
    expect(rows[0].engagementRate).toBeGreaterThan(1); // fraction normalized to percent
  });
});
