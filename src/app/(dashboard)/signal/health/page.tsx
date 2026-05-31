'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getActiveProfileId, getHealthData, type HealthData } from '@/lib/signal-data';

const SCAN_LINE = 'repeating-linear-gradient(to bottom, transparent 0px, transparent 4px, rgba(28,22,18,0.4) 4px, rgba(28,22,18,0.4) 5px)';

const panelStyle: React.CSSProperties = {
  background: '#1C1612',
  border: '1px solid #413226',
  borderRadius: 2,
  position: 'relative',
  overflow: 'hidden',
};

function ScanOverlay() {
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: SCAN_LINE, zIndex: 1 }} />;
}

function PanelTitleBar({ title, accent }: { title: string; accent?: boolean }) {
  return (
    <div style={{ background: '#100E0C', borderBottom: `1px solid ${accent ? 'rgba(232,104,42,0.4)' : '#413226'}`, padding: '6px 12px', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.2em', color: accent ? '#E8682A' : '#6E604E' }}>
      {title}
    </div>
  );
}

const NAV_LINKS = [
  { href: '/signal', label: 'OVERVIEW' },
  { href: '/signal/posts', label: 'POSTS' },
  { href: '/signal/audience', label: 'AUDIENCE' },
  { href: '/signal/health', label: 'HEALTH' },
];

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const profileId = await getActiveProfileId(supabase);
      if (cancelled) return;
      if (!profileId) {
        setData({ lastCapture: null, events: [] });
        setLoading(false);
        return;
      }
      const d = await getHealthData(supabase, profileId);
      if (cancelled) return;
      setData(d);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const events = data?.events ?? [];
  const lastCapture = data?.lastCapture ?? null;
  const captured = events.length > 0;

  const statusCards = [
    captured
      ? { label: 'EXTENSION STATUS', value: 'CONNECTED', sub: 'Receiving captures', color: '#82C896' }
      : { label: 'EXTENSION STATUS', value: 'NOT CONNECTED', sub: 'Install & configure extension', color: '#FF5555' },
    { label: 'LAST CAPTURE', value: lastCapture ? new Date(lastCapture).toLocaleDateString() : '—', sub: lastCapture ? 'Most recent capture' : 'Awaiting first capture', color: lastCapture ? '#F0E4D0' : '#B4A690' },
    { label: 'PENDING QUEUE', value: '0', sub: 'Items waiting to ship', color: '#82C896' },
  ];

  return (
    <div style={{ background: '#16120E', minHeight: '100vh', color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace" }}>
      <nav style={{ background: '#100E0C', borderBottom: '1px solid #413226', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href="/signal" style={{ fontFamily: "'Silkscreen', monospace", fontSize: 10, color: '#6E604E', letterSpacing: '0.2em', textDecoration: 'none' }}>◈ SIGNAL</Link>
        <div style={{ display: 'flex', gap: 24 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} style={{ color: href === '/signal/health' ? '#E8682A' : '#6E604E', textDecoration: 'none', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.15em' }}>{label}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 32px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 300, marginBottom: 32, fontFamily: "'Jura', sans-serif", color: '#F0E4D0' }}>Capture Health</h1>

        {/* Status cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {statusCards.map(({ label, value, sub, color }) => (
            <div key={label} style={{ ...panelStyle }}>
              <ScanOverlay />
              <PanelTitleBar title={label} />
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 22, fontFamily: "'Jura', sans-serif", fontWeight: 300, color, marginBottom: 6 }}>{value}</div>
                <div style={{ fontSize: 11, color: '#6E604E', fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Setup instructions */}
        <div style={{ ...panelStyle, marginBottom: 32, border: '1px solid rgba(232,104,42,0.3)' }}>
          <ScanOverlay />
          <PanelTitleBar title="SETUP CHECKLIST" accent />
          <div style={{ padding: '16px 20px' }}>
            {[
              '1. Build extension: cd projects/linkedin-analytics/extension && npm run build',
              '2. Load unpacked in Chrome: chrome://extensions → Load unpacked → select dist/ folder',
              '3. Set LI_INGEST_TOKEN in Supabase Edge Function env vars',
              '4. Open extension popup → Configure → paste ingest URL + token → Save',
              '5. Navigate to linkedin.com — capture starts automatically',
              '6. Open your LinkedIn analytics pages to trigger backfill',
            ].map((step, i) => (
              <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#B4A690', padding: '6px 0', borderBottom: i < 5 ? '1px solid rgba(65,50,38,0.4)' : 'none' }}>
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Capture event log */}
        <div style={{ ...panelStyle }}>
          <ScanOverlay />
          <PanelTitleBar title="CAPTURE EVENT LOG" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #413226' }}>
                {['TIMESTAMP', 'ENDPOINT', 'STATUS', 'RECORDS'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#6E604E', fontFamily: "'Silkscreen', monospace", fontSize: 8, letterSpacing: '0.15em', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(loading || events.length === 0) && (
                <tr>
                  <td colSpan={4} style={{ padding: '24px 10px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", color: '#B4A690', fontSize: 11 }}>
                    {loading ? 'LOADING…' : 'No captures yet — import or connect to get started.'}
                  </td>
                </tr>
              )}
              {!loading && events.map((evt, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(65,50,38,0.4)' }}>
                  <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", color: '#6E604E', fontSize: 10 }}>{new Date(evt.ts).toLocaleTimeString()}</td>
                  <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", color: '#B4A690', fontSize: 10 }}>{evt.endpoint.replace('/voyager/api/', '')}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: evt.status === 'success' ? '#82C896' : '#FF5555', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{evt.status}</span>
                  </td>
                  <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", color: '#FFB86C', fontSize: 10 }}>{evt.records}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
