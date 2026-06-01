import { redirect } from 'next/navigation';

// Buckler has no marketing root yet — send the bare URL straight to the dashboard.
// Middleware on /buckler handles auth (or auto-login for gated single-account deploys).
export default function Home() {
  redirect('/buckler');
}
