'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === 'project-insight') {
      document.cookie = 'signal_auth=granted; path=/; max-age=2592000; samesite=strict';
      const from = params.get('from') ?? '/signal';
      router.push(from);
    } else {
      setError(true);
      setPw('');
    }
  }

  return (
    <div style={{ width: 340, padding: '40px 32px', background: '#1C1612', border: '1px solid rgba(232,104,42,0.2)', borderRadius: 2 }}>
      {/* Scan line overlay */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 2, pointerEvents: 'none', background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 4px, rgba(28,22,18,0.4) 4px, rgba(28,22,18,0.4) 5px)' }} />
      {/* Panel title bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#100E0C', borderBottom: '1px solid #413226', padding: '6px 12px', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.2em', color: '#6E604E', borderRadius: '2px 2px 0 0' }}>
        PROJECT INSIGHT
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ color: '#F0E4D0', fontSize: 22, fontFamily: "'Jura', sans-serif", fontWeight: 300, marginBottom: 24 }}>Access Required</div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false); }}
            placeholder="enter password"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box', padding: '12px 14px',
              background: 'rgba(240,228,208,0.05)', border: `1px solid ${error ? '#FF5555' : 'rgba(240,228,208,0.15)'}`,
              color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: 'none', marginBottom: 12,
            }}
          />
          {error && <div style={{ color: '#FF5555', fontSize: 11, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>incorrect password</div>}
          <button type="submit" style={{
            width: '100%', padding: '12px', background: '#E8682A', color: '#16120E',
            border: 'none', fontFamily: "'Silkscreen', monospace", fontWeight: 400, fontSize: 10, cursor: 'pointer',
            letterSpacing: '0.2em',
          }}>ENTER</button>
        </form>
      </div>
    </div>
  );
}

export default function SignalLogin() {
  return (
    <main style={{ background: '#16120E', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace" }}>
      <Suspense fallback={<div style={{ color: 'rgba(240,228,208,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>loading...</div>}>
        <div style={{ position: 'relative' }}>
          <LoginForm />
        </div>
      </Suspense>
    </main>
  );
}
