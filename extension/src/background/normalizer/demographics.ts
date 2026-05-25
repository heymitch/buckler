// STUB — verify shapes via Phase 0 API sniffing

export interface NormalizedDemographic {
  post_urn: string;
  dimension: string;
  value: string;
  count: number;
  percentage?: number;
}

type DimensionItem = {
  entityUrn?: string;
  localizedName?: string;
  name?: string;
  count?: number;
  percentage?: number;
};

const DIMENSION_KEYS: Record<string, string> = {
  jobTitles: 'job_title',
  companies: 'company',
  industries: 'industry',
  geoRegions: 'location',
  seniorities: 'seniority',
  companySizes: 'company_size',
};

export function normalizeDemographics(data: unknown, postUrn?: string): NormalizedDemographic[] {
  try {
    const d = data as Record<string, unknown>;
    const results: NormalizedDemographic[] = [];

    const urn = postUrn ?? d.urn as string ?? d.postUrn as string;

    for (const [key, dimension] of Object.entries(DIMENSION_KEYS)) {
      const items = (d[key] as DimensionItem[]) ?? [];
      for (const item of items) {
        results.push({
          post_urn: urn,
          dimension,
          value: item.localizedName ?? item.name ?? item.entityUrn ?? 'unknown',
          count: item.count ?? 0,
          percentage: item.percentage,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}
