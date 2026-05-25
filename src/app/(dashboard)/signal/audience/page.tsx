'use client';

import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MOCK_AUDIENCE = {
  job_titles: [
    { name: 'Founder / CEO', count: 1840 },
    { name: 'Marketing Manager', count: 1210 },
    { name: 'Content Creator', count: 980 },
    { name: 'Consultant', count: 760 },
    { name: 'Product Manager', count: 640 },
    { name: 'Coach / Trainer', count: 520 },
    { name: 'Sales Manager', count: 480 },
    { name: 'Director', count: 410 },
  ],
  industries: [
    { name: 'Technology', count: 2240 },
    { name: 'Marketing & Advertising', count: 1480 },
    { name: 'Professional Services', count: 1020 },
    { name: 'Education', count: 820 },
    { name: 'Media & Entertainment', count: 540 },
    { name: 'Financial Services', count: 380 },
  ],
  locations: [
    { name: 'United States', count: 3120 },
    { name: 'United Kingdom', count: 640 },
    { name: 'Canada', count: 580 },
    { name: 'Australia', count: 420 },
    { name: 'India', count: 360 },
  ],
};

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

function PanelTitleBar({ title }: { title: string }) {
  return (
    <div style={{ background: '#100E0C', borderBottom: '1px solid #413226', padding: '6px 12px', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.2em', color: '#6E604E' }}>
      {title}
    </div>
  );
}

const customTooltipStyle = {
  background: '#1C1612', border: '1px solid #413226',
  color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, borderRadius: 2, padding: '8px 12px',
};

function HorizontalBar({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#B4A690' }}>{count.toLocaleString()}</span>
      </div>
      <div style={{ height: 5, background: '#100E0C', border: '1px solid #413226', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: 'linear-gradient(to right, #3C6446, #82C896, #FFB86C)', borderRadius: 2 }} />
      </div>
    </div>
  );
}

const NAV_LINKS = [
  { href: '/signal', label: 'OVERVIEW' },
  { href: '/signal/posts', label: 'POSTS' },
  { href: '/signal/audience', label: 'AUDIENCE' },
  { href: '/signal/health', label: 'HEALTH' },
];

export default function AudiencePage() {
  return (
    <div style={{ background: '#16120E', minHeight: '100vh', color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace" }}>
      <nav style={{ background: '#100E0C', borderBottom: '1px solid #413226', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href="/signal" style={{ fontFamily: "'Silkscreen', monospace", fontSize: 10, color: '#6E604E', letterSpacing: '0.2em', textDecoration: 'none' }}>◈ SIGNAL</Link>
        <div style={{ display: 'flex', gap: 24 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} style={{ color: href === '/signal/audience' ? '#E8682A' : '#6E604E', textDecoration: 'none', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.15em' }}>{label}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 300, marginBottom: 32, fontFamily: "'Jura', sans-serif", color: '#F0E4D0' }}>Audience</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
          {/* Job Titles */}
          <div style={{ ...panelStyle }}>
            <ScanOverlay />
            <PanelTitleBar title="TOP JOB TITLES" />
            <div style={{ padding: '20px 24px' }}>
              {MOCK_AUDIENCE.job_titles.map(item => (
                <HorizontalBar key={item.name} label={item.name} count={item.count} max={MOCK_AUDIENCE.job_titles[0].count} />
              ))}
            </div>
          </div>

          {/* Industries */}
          <div style={{ ...panelStyle }}>
            <ScanOverlay />
            <PanelTitleBar title="TOP INDUSTRIES" />
            <div style={{ padding: '20px 24px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MOCK_AUDIENCE.industries} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,50,38,0.6)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6E604E', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#B4A690', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} width={160} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="count" fill="#E8682A" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div style={{ ...panelStyle }}>
          <ScanOverlay />
          <PanelTitleBar title="TOP LOCATIONS" />
          <div style={{ padding: '20px 24px' }}>
            <div style={{ maxWidth: 600 }}>
              {MOCK_AUDIENCE.locations.map(item => (
                <HorizontalBar key={item.name} label={item.name} count={item.count} max={MOCK_AUDIENCE.locations[0].count} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: 'right', fontSize: 8, color: '#6E604E', fontFamily: "'Silkscreen', monospace", letterSpacing: '0.1em' }}>⚠ MOCK DATA</div>
      </div>
    </div>
  );
}
