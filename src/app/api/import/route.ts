import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseShieldCsv } from '@/lib/import/shield-csv';
import { parseLinkedInXlsx } from '@/lib/import/linkedin-xlsx';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File;
  const profileId = form.get('profileId') as string;
  const source = form.get('source') as 'shield_csv' | 'linkedin_xlsx';
  if (!file || !profileId) return NextResponse.json({ error: 'file and profileId required' }, { status: 400 });

  const result = source === 'shield_csv'
    ? parseShieldCsv(await file.text())
    : parseLinkedInXlsx(await file.arrayBuffer());

  // Only rows with a URN can use the (profile_id, li_post_urn) upsert; surface the rest as skipped.
  const withUrn = result.rows.filter(p => p.liPostUrn);
  const skipped = result.skipped + (result.rows.length - withUrn.length);

  const payload = withUrn.map(p => ({
    profile_id: profileId, li_post_urn: p.liPostUrn, text: p.text,
    published_at: p.publishedAt, post_type: p.postType, impressions: p.impressions,
    members_reached: p.membersReached, reactions: p.reactions, comments: p.comments,
    reposts: p.reposts, shares: p.shares, engagement_rate: p.engagementRate,
    profile_views: p.profileViews, followers_gained: p.followersGained,
    saves: p.saves, sends: p.sends, source: p.source,
  }));

  // TODO: generate Supabase types
  const { error } = await supabase.from('posts')
    .upsert(payload as any, { onConflict: 'profile_id,li_post_urn' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // TODO: generate Supabase types
  await supabase.from('imports').insert({
    owner_user_id: user.id, profile_id: profileId, source,
    filename: file.name, rows_imported: payload.length,
  } as any);

  return NextResponse.json({ imported: payload.length, skipped });
}
