import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Password-login bypass that skips the magic-link flow. Signs in as the single
// configured account (BUCKLER_DEV_LOGIN_EMAIL / _PASSWORD).
//
// Enabled when EITHER:
//   - NODE_ENV === 'development'  (local dev convenience), OR
//   - BUCKLER_AUTO_LOGIN === 'true'  (single-account deployment)
//
// SECURITY: in a deployment you MUST front this with an external gate
// (e.g. Vercel Authentication / Password Protection). It only ever signs in
// the one configured owner account, but without a gate it would let anyone do so.
// 404s otherwise, so a normal multi-tenant install can never reach it.
export async function GET(req: Request) {
  const enabled =
    process.env.NODE_ENV === 'development' || process.env.BUCKLER_AUTO_LOGIN === 'true';
  if (!enabled) {
    return new NextResponse('Not found', { status: 404 });
  }

  const email = process.env.BUCKLER_DEV_LOGIN_EMAIL;
  const password = process.env.BUCKLER_DEV_LOGIN_PASSWORD;
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Set BUCKLER_DEV_LOGIN_EMAIL and BUCKLER_DEV_LOGIN_PASSWORD in .env.local' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const url = new URL(req.url);
  return NextResponse.redirect(`${url.origin}/buckler`);
}
