'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
export default function Login() {
  const [email, setEmail] = useState(''); const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    setSent(true);
  }
  return sent ? <p>Check your email for a login link.</p> : (
    <form onSubmit={submit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
      <button type="submit">Send magic link</button>
    </form>
  );
}
