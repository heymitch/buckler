'use client';

import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MOCK_POST = {
  id: '1',
  commentary: "The best AI tool nobody is talking about...\n\nEveryone is obsessed with ChatGPT and Claude. But the real leverage is in what you build on top of them.\n\nWe've been running Claude Cowork Bootcamp for 2 cohorts now. And the #1 thing that separates students who 10x their output from those who plateau?\n\nThey build .Skills.\n\nA .Skill is a saved, reusable workflow. You build it once. Claude runs it forever.\n\nThe tool? Cowork by Anthropic. The strategy? Save everything you do more than once.",
  published: '2026-04-28',
  type: 'text',
  impressions: 24800,
  engagement: 8.4,
  reactions_total: 342,
  reactions_like: 198,
  reactions_celebrate: 67,
  reactions_insightful: 48,
  reactions_love: 29,
  comments: 87,
  reposts: 23,
  clicks: 410,
};

const MOCK_IMPRESSION_CURVE = [
  { h: '0h', impressions: 0 }, { h: '2h', impressions: 1200 },
  { h: '6h', impressions: 4800 }, { h: '12h', impressions: 11200 },
  { h: '24h', impressions: 17600 }, { h: '48h', impressions: 21900 },
  { h: '72h', impressions: 23400 }, { h: '7d', impressions: 24400 },
  { h: '14d', impressions: 24800 },
];

const MOCK_DEMOGRAPHICS = {
  job_title: [
    { value: 'Founder / CEO', pct: 28 },
    { value: 'Marketing Manager', pct: 18 },
    { value: 'Content Creator', pct: 14 },
    { value: 'Consultant', pct: 11 },
    { value: 'Product Manager', pct: 9 },
  ],
  industry: [
    { value: 'Technology', pct: 34 },
    { value: 'Marketing & Advertising', pct: 22 },
    { value: 'Professional Services', pct: 16 },
    { value: 'Education', pct: 12 },
    { value: 'Media & Entertainment', pct: 8 },
  ],
  seniority: [
    { value: 'Owner / Partner', pct: 31 },
    { value: 'Senior', pct: 27 },
    { value: 'Manager', pct: 19 },
    { value: 'Director', pct: 13 },
    { value: 'Entry', pct: 10 },
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
  color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
  borderRadius: 2, padding: '8px 12px',
};

function ReactionBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#B4A690', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#F0E4D0' }}>{count}</span>
      </div>
      <div style={{ height: 4, background: '#100E0C', border: '1px solid #413226', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function DemoTable({ title, data }: { title: string; data: { value: string; pct: number }[] }) {
  return (
    <div style={{ ...panelStyle }}>
      <ScanOverlay />
      <PanelTitleBar title={title} />
      <div style={{ padding: '16px 20px' }}>
        {data.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1, fontSize: 11, color: '#F0E4D0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>{row.value}</div>
            <div style={{ width: 80, height: 4, background: '#100E0C', border: '1px solid #413226', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${row.pct}%`, background: 'linear-gradient(to right, #3C6446, #82C896, #FFB86C)', borderRadius: 2 }} />
            </div>
            <div style={{ width: 36, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#B4A690' }}>{row.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PostDetail() {
  const p = MOCK_POST;

  return (
    <div style={{ background: '#16120E', minHeight: '100vh', color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace" }}>
      <nav style={{ background: '#100E0C', borderBottom: '1px solid #413226', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/signal" style={{ fontFamily: "'Silkscreen', monospace", fontSize: 10, color: '#6E604E', letterSpacing: '0.2em', textDecoration: 'none' }}>◈ SIGNAL</Link>
        <span style={{ color: '#413226' }}>/</span>
        <Link href="/signal/posts" style={{ color: '#6E604E', textDecoration: 'none', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.15em' }}>POSTS</Link>
        <span style={{ color: '#413226' }}>/</span>
        <span style={{ color: '#E8682A', fontFamily: "'Silkscreen', monospace", fontSize: 9 }}>DETAIL</span>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Post content */}
            <div style={{ ...panelStyle }}>
              <ScanOverlay />
              <PanelTitleBar title="POST CONTENT" />
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <span style={{ padding: '2px 8px', background: 'rgba(65,50,38,0.5)', borderRadius: 2, fontFamily: "'Silkscreen', monospace", fontSize: 8, color: '#B4A690' }}>{p.type.toUpperCase()}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6E604E' }}>{p.published}</span>
                </div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.7, color: '#F0E4D0' }}>{p.commentary}</pre>
              </div>
            </div>

            {/* Impression curve */}
            <div style={{ ...panelStyle }}>
              <ScanOverlay />
              <PanelTitleBar title="IMPRESSION CURVE" />
              <div style={{ padding: '20px 24px' }}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={MOCK_IMPRESSION_CURVE}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,50,38,0.6)" />
                    <XAxis dataKey="h" tick={{ fill: '#6E604E', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6E604E', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Line type="monotone" dataKey="impressions" stroke="#82C896" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demographics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <DemoTable title="JOB TITLES" data={MOCK_DEMOGRAPHICS.job_title} />
              <DemoTable title="INDUSTRIES" data={MOCK_DEMOGRAPHICS.industry} />
              <DemoTable title="SENIORITY" data={MOCK_DEMOGRAPHICS.seniority} />
            </div>
          </div>

          {/* Right column — metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'IMPRESSIONS', value: p.impressions.toLocaleString(), color: '#FFB86C' },
              { label: 'ENGAGEMENT RATE', value: `${p.engagement}%`, color: '#E8682A' },
              { label: 'COMMENTS', value: String(p.comments), color: '#F0E4D0' },
              { label: 'REPOSTS', value: String(p.reposts), color: '#F0E4D0' },
              { label: 'CLICKS', value: String(p.clicks), color: '#F0E4D0' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ ...panelStyle }}>
                <ScanOverlay />
                <PanelTitleBar title={label} />
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 32, fontFamily: "'Jura', sans-serif", fontWeight: 300, color }}>{value}</div>
                </div>
              </div>
            ))}

            {/* Reactions breakdown */}
            <div style={{ ...panelStyle }}>
              <ScanOverlay />
              <PanelTitleBar title={`REACTIONS (${p.reactions_total})`} />
              <div style={{ padding: '16px 20px' }}>
                <ReactionBar label="👍 Like" count={p.reactions_like} total={p.reactions_total} color="#FFB86C" />
                <ReactionBar label="🎉 Celebrate" count={p.reactions_celebrate} total={p.reactions_total} color="#82C896" />
                <ReactionBar label="💡 Insightful" count={p.reactions_insightful} total={p.reactions_total} color="#4A9DB8" />
                <ReactionBar label="❤️ Love" count={p.reactions_love} total={p.reactions_total} color="#E8682A" />
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: 8, color: '#6E604E', fontFamily: "'Silkscreen', monospace", letterSpacing: '0.1em' }}>⚠ MOCK DATA</div>
      </div>
    </div>
  );
}
