import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => res.cookies.set(name, value, options)) } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Auto-login mode: single-account deployments fronted by an external gate
    // (e.g. Vercel Authentication). The whole app signs in as the configured
    // owner so there's no second login wall. Off by default — normal installs
    // get the magic-link flow.
    const dest = process.env.BUCKLER_AUTO_LOGIN === 'true' ? '/auth/dev-login' : '/auth/login';
    return NextResponse.redirect(new URL(dest, req.url));
  }
  return res;
}
export const config = { matcher: ['/buckler/:path*', '/import/:path*'] };
