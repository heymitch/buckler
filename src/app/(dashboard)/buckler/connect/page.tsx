'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ─── Shared styles (matches buckler/page.tsx) ──────────────────────────────────
const SCAN_LINE = 'repeating-linear-gradient(to bottom, transparent 0px, transparent 4px, rgba(28,22,18,0.4) 4px, rgba(28,22,18,0.4) 5px)';

const panelStyle: React.CSSProperties = {
  background: '#1C1612',
  border: '1px solid #413226',
  borderRadius: 2,
  position: 'relative',
  overflow: 'hidden',
};

function PanelTitleBar({ title }: { title: string }) {
  return (
    <div style={{ background: '#100E0C', borderBottom: '1px solid #413226', padding: '6px 12px', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.2em', color: '#6E604E' }}>
      {title}
    </div>
  );
}

function ScanOverlay() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: SCAN_LINE, zIndex: 1 }} />
  );
}

const NAV_LINKS = [
  { href: '/buckler', label: 'OVERVIEW' },
  { href: '/buckler/posts', label: 'POSTS' },
  { href: '/buckler/audience', label: 'AUDIENCE' },
  { href: '/buckler/health', label: 'HEALTH' },
];

type Profile = { id: string; name: string };

export default function ConnectPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'url' | 'token' | null>(null);

  const ingestUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/buckler-ingest`;

  useEffect(() => {
    const supabase = createClient();
    supabase.from('buckler_profiles').select('id,name').order('name').then(({ data }) => {
      const rows = (data ?? []) as Profile[];
      setProfiles(rows);
      if (rows.length > 0) setProfileId(rows[0].id);
      setLoading(false);
    });
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setToken(null);
    try {
      const res = await fetch('/api/ingest-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Unknown error');
      setToken(json.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate token');
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard(value: string, key: 'url' | 'token') {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const inputStyle: React.CSSProperties = {
    background: '#0D0B09',
    border: '1px solid #413226',
    color: '#F0E4D0',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    padding: '10px 14px',
    flex: 1,
    outline: 'none',
    borderRadius: 0,
  };

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    background: active ? '#E8682A' : 'transparent',
    color: active ? '#16120E' : '#6E604E',
    border: '1px solid #413226',
    cursor: 'pointer',
    fontFamily: "'Silkscreen', monospace",
    fontSize: 8,
    letterSpacing: '0.1em',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ background: '#16120E', minHeight: '100vh', color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Nav */}
      <nav style={{ background: '#100E0C', borderBottom: '1px solid #413226', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 32 }}>
        <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: 10, color: '#6E604E', letterSpacing: '0.2em' }}>◈ BUCKLER</span>
        <div style={{ display: 'flex', gap: 24, fontSize: 11 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} style={{ color: '#6E604E', textDecoration: 'none', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.15em' }}>
              {label}
            </Link>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.15em', color: '#E8682A' }}>CONNECT</span>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div>
          <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: 8, letterSpacing: '0.2em', color: '#6E604E', marginBottom: 10 }}>
            ◈ CAPTURE EXTENSION — SETUP
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: '#F0E4D0', letterSpacing: '0.02em' }}>
            Connect the extension
          </h1>
        </div>

        {/* Profile selector + generate */}
        <div style={{ ...panelStyle }}>
          <ScanOverlay />
          <PanelTitleBar title="1 — SELECT PROFILE" />
          <div style={{ padding: '20px 24px' }}>
            {loading ? (
              <div style={{ color: '#6E604E', fontSize: 12 }}>Loading profiles…</div>
            ) : profiles.length === 0 ? (
              <div style={{ color: '#B4A690', fontSize: 13 }}>
                No profiles found.{' '}
                <Link href="/import" style={{ color: '#E8682A', textDecoration: 'none' }}>
                  Create a profile first (import some data)
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <select
                  value={profileId}
                  onChange={e => { setProfileId(e.target.value); setToken(null); }}
                  style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !profileId}
                  style={{ ...btnStyle(true), opacity: generating || !profileId ? 0.5 : 1 }}
                >
                  {generating ? 'GENERATING…' : 'GENERATE CAPTURE TOKEN'}
                </button>
              </div>
            )}
            {error && (
              <div style={{ marginTop: 12, color: '#FF6B6B', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                Error: {error}
              </div>
            )}
          </div>
        </div>

        {/* Token output */}
        {token && (
          <div style={{ ...panelStyle }}>
            <ScanOverlay />
            <PanelTitleBar title="2 — COPY CREDENTIALS" />
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Ingest URL */}
              <div>
                <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: 8, letterSpacing: '0.15em', color: '#6E604E', marginBottom: 6 }}>
                  INGEST URL
                </div>
                <div style={{ display: 'flex', gap: 0 }}>
                  <input
                    readOnly
                    value={ingestUrl}
                    style={{ ...inputStyle }}
                  />
                  <button
                    onClick={() => copyToClipboard(ingestUrl, 'url')}
                    style={{ ...btnStyle(copied === 'url'), borderLeft: 'none' }}
                  >
                    {copied === 'url' ? 'COPIED' : 'COPY'}
                  </button>
                </div>
              </div>

              {/* Token */}
              <div>
                <div style={{ fontFamily: "'Silkscreen', monospace", fontSize: 8, letterSpacing: '0.15em', color: '#6E604E', marginBottom: 6 }}>
                  TOKEN
                </div>
                <div style={{ display: 'flex', gap: 0 }}>
                  <input
                    readOnly
                    value={token}
                    style={{ ...inputStyle }}
                  />
                  <button
                    onClick={() => copyToClipboard(token, 'token')}
                    style={{ ...btnStyle(copied === 'token'), borderLeft: 'none' }}
                  >
                    {copied === 'token' ? 'COPIED' : 'COPY'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div style={{ ...panelStyle }}>
          <ScanOverlay />
          <PanelTitleBar title="3 — CONFIGURE EXTENSION" />
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#B4A690', lineHeight: 1.7 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: '#E8682A', fontFamily: "'Silkscreen', monospace", fontSize: 9 }}>01</span>
              <span>Open the <strong style={{ color: '#F0E4D0' }}>Project Insight</strong> extension popup in your browser toolbar.</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: '#E8682A', fontFamily: "'Silkscreen', monospace", fontSize: 9 }}>02</span>
              <span>Click <strong style={{ color: '#F0E4D0' }}>Configure</strong> and paste the <strong style={{ color: '#F0E4D0' }}>Ingest URL</strong> and <strong style={{ color: '#F0E4D0' }}>Token</strong> from above.</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: '#E8682A', fontFamily: "'Silkscreen', monospace", fontSize: 9 }}>03</span>
              <span>Click <strong style={{ color: '#F0E4D0' }}>Save</strong>. The extension will now send captures to the selected profile.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
