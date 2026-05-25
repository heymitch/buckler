import { createClient } from 'jsr:@supabase/supabase-js@2';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const ALLOWED_DIMENSIONS = new Set(['job_title', 'company', 'location', 'company_size', 'industry']);
const n = (v: unknown): number | null => (v == null || v === '' ? null : Number(v));

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'missing token' }, 401);

  const { data: tok } = await admin.from('ingest_tokens')
    .select('owner_user_id, profile_id').eq('token', token).maybeSingle();
  if (!tok) return json({ error: 'bad token' }, 401);
  await admin.from('ingest_tokens').update({ last_used_at: new Date().toISOString() }).eq('token', token);

  const profileId = tok.profile_id as string;
  let body: { payload_type?: string; data?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  const type = body.payload_type;
  const data = body.data;

  try {
    if (type === 'posts' && Array.isArray(data)) {
      const rows = data.map((p: any) => ({
        profile_id: profileId, li_post_urn: p.post_urn, text: p.commentary ?? null,
        published_at: p.published_at ?? null, post_type: p.post_type ?? null, source: 'extension',
      })).filter((r) => r.li_post_urn);
      if (rows.length) await admin.from('posts').upsert(rows, { onConflict: 'profile_id,li_post_urn' });
      return json({ ok: true, written: rows.length });
    }

    if (type === 'post_metrics' && Array.isArray(data)) {
      let written = 0;
      for (const m of data as any[]) {
        if (!m.post_urn) continue;
        await admin.from('posts').upsert({
          profile_id: profileId, li_post_urn: m.post_urn, source: 'extension',
          impressions: n(m.impressions), members_reached: n(m.unique_impressions),
          reactions: n(m.reactions_total), comments: n(m.comments),
          reposts: n(m.reposts), shares: n(m.shares),
        }, { onConflict: 'profile_id,li_post_urn' });
        written++;
      }
      return json({ ok: true, written });
    }

    if (type === 'post_demographics' && Array.isArray(data)) {
      const clean = (data as any[]).filter((d) => ALLOWED_DIMENSIONS.has(d.dimension));
      const dims = [...new Set(clean.map((d) => d.dimension))];
      for (const dim of dims) {
        await admin.from('audience_demographics').delete().eq('profile_id', profileId).eq('dimension', dim);
      }
      const rows = clean.map((d) => ({
        profile_id: profileId, dimension: d.dimension, value: String(d.value), count: n(d.count) ?? 0,
      }));
      if (rows.length) await admin.from('audience_demographics').insert(rows);
      return json({ ok: true, written: rows.length });
    }

    if (type === 'profile_snapshot' || type === 'profile_identity') {
      const d = (data ?? {}) as any;
      if (d.headline) await admin.from('profiles').update({ headline: d.headline }).eq('id', profileId);
      const fc = n(d.follower_count);
      if (fc != null) {
        await admin.from('follower_snapshots').upsert({
          profile_id: profileId, date: new Date().toISOString().slice(0, 10),
          follower_count: fc,
        }, { onConflict: 'profile_id,date' });
      }
      return json({ ok: true });
    }

    return json({ ok: true, ignored: type ?? 'unknown' });
  } catch (e) {
    console.error('ingest error', e);
    return json({ error: 'internal error' }, 500);
  }
});

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}
