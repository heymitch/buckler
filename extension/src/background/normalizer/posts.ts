// STUB — verify shapes via Phase 0 API sniffing

export interface NormalizedPost {
  post_urn: string;
  published_at: string;
  post_type: string;
  commentary?: string;
  media_urls?: string[];
  permalink?: string;
  is_repost: boolean;
  reposted_from_urn?: string;
  raw_payload?: unknown;
}

export function normalizePosts(data: unknown): NormalizedPost[] {
  try {
    const d = data as Record<string, unknown>;
    const elements = (d.elements as unknown[]) ?? [];

    return elements
      .map((el: unknown): NormalizedPost | null => {
        try {
          const e = el as Record<string, unknown>;

          // Extract URN — may be in updateMetadata or directly
          const urn = (e.updateMetadata as Record<string, unknown>)?.urn as string
            ?? e.entityUrn as string
            ?? e.urn as string;
          if (!urn) return null;

          // Published time
          const publishedAt = (e.published as Record<string, unknown>)?.on as number
            ?? (e.updateMetadata as Record<string, unknown>)?.publicationDate as number;

          // Commentary / text
          const commentary = (e.commentary as Record<string, unknown>)?.text as string
            ?? e.commentary as string;

          // Post type detection
          let post_type = 'text';
          if (e.content) {
            const content = e.content as Record<string, unknown>;
            if (content.video) post_type = 'video';
            else if (content.document) post_type = 'document';
            else if (content.article) post_type = 'article';
            else if (content.poll) post_type = 'poll';
            else if (Array.isArray(content.images) && (content.images as unknown[]).length > 0) post_type = 'image';
          }

          const is_repost = !!(e.resharedUpdate);

          return {
            post_urn: urn,
            published_at: publishedAt
              ? new Date(publishedAt).toISOString()
              : new Date().toISOString(),
            post_type,
            commentary: commentary || undefined,
            is_repost,
            reposted_from_urn: is_repost
              ? ((e.resharedUpdate as Record<string, unknown>)?.entityUrn as string)
              : undefined,
            raw_payload: el,
          };
        } catch {
          return null;
        }
      })
      .filter((p): p is NormalizedPost => p !== null);
  } catch {
    return [];
  }
}
