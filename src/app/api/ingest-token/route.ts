import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST { profileId, label? } -> { token }   |   DELETE { token }
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { profileId, label } = await req.json();
  if (!profileId) return NextResponse.json({ error: 'profileId required' }, { status: 400 });
  // TODO: generate Supabase types
  const { data, error } = await supabase.from('signal_ingest_tokens')
    .insert({ owner_user_id: user.id, profile_id: profileId, label } as any)
    .select('token').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token: (data as any).token });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { token } = await req.json();
  // TODO: generate Supabase types
  const { error } = await supabase.from('signal_ingest_tokens').delete().eq('token', token as any);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
