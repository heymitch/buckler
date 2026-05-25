// STUB — these shapes need verification against real Voyager responses (Phase 0)
// See PRD §6.1 for sniffer instructions
// Known shape based on community reverse-engineering; may drift

export interface NormalizedProfile {
  vanity_name?: string;
  full_name?: string;
  headline?: string;
  follower_count?: number;
  connection_count?: number;
}

export function normalizeProfile(url: string, data: unknown): NormalizedProfile | null {
  try {
    const d = data as Record<string, unknown>;

    // /me endpoint shape
    if (url.includes('/voyager/api/me')) {
      return {
        vanity_name: (d.miniProfile as Record<string, unknown>)?.publicIdentifier as string,
        full_name: [
          (d.miniProfile as Record<string, unknown>)?.firstName,
          (d.miniProfile as Record<string, unknown>)?.lastName
        ].filter(Boolean).join(' ') || undefined,
        headline: (d.miniProfile as Record<string, unknown>)?.occupation as string,
      };
    }

    // /dash/profiles shape
    const elements = (d.elements as unknown[]) ?? [];
    const profile = elements[0] as Record<string, unknown>;
    if (!profile) return null;

    return {
      vanity_name: profile.publicIdentifier as string,
      full_name: profile.firstName && profile.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : (profile.localizedName as string),
      headline: profile.headline as string || (profile.localizedHeadline as string),
      follower_count: (profile.followingState as Record<string, unknown>)?.followerCount as number,
    };
  } catch {
    return null;
  }
}

export function extractPersonUrn(url: string, data: unknown): string | null {
  try {
    const d = data as Record<string, unknown>;
    // /me endpoint
    if (url.includes('/voyager/api/me')) {
      return (d.miniProfile as Record<string, unknown>)?.entityUrn as string
        ?? (d.plainId as string ? `urn:li:member:${d.plainId}` : null);
    }
    // /dash/profiles
    const elements = (d.elements as unknown[]) ?? [];
    const profile = elements[0] as Record<string, unknown>;
    return profile?.entityUrn as string ?? null;
  } catch {
    return null;
  }
}
