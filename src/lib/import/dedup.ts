import { createHash } from 'node:crypto';
import type { NormalizedPost } from './types';

export function postKey(p: NormalizedPost): string {
  if (p.liPostUrn) return p.liPostUrn;
  const h = createHash('sha1').update(`${p.publishedAt ?? ''}|${p.text ?? ''}`).digest('hex').slice(0, 16);
  return `h:${h}`;
}
