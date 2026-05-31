import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Dev-only convenience: skips the magic-link flow on localhost.
// 404s unless NODE_ENV === 'development', so it can never establish a session
// in a real deploy. Credentials come from BUCKLER_DEV_LOGIN_EMAIL / _PASSWORD.
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
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
