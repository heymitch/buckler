export interface NormalizedPost {
  liPostUrn: string | null;
  text: string | null;
  publishedAt: string | null;      // ISO8601
  postType: string | null;
  impressions: number | null;
  membersReached: number | null;
  reactions: number | null;
  comments: number | null;
  reposts: number | null;
  shares: number | null;
  engagementRate: number | null;
  profileViews: number | null;
  followersGained: number | null;
  saves: number | null;
  sends: number | null;
  source: 'shield_csv' | 'linkedin_xlsx' | 'extension';
}

export interface ImportResult {
  rows: NormalizedPost[];
  skipped: number;
}
