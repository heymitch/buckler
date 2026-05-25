'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

// ─── Mock data ─────────────────────────────────────────────
const MOCK_FOLLOWER_GROWTH = [
  { date: 'Mar 10', followers: 4820 }, { date: 'Mar 17', followers: 4934 },
  { date: 'Mar 24', followers: 5102 }, { date: 'Mar 31', followers: 5289 },
  { date: 'Apr 7', followers: 5441 }, { date: 'Apr 14', followers: 5618 },
  { date: 'Apr 21', followers: 5790 }, { date: 'Apr 28', followers: 5944 },
  { date: 'May 5', followers: 6103 },
];

const MOCK_POSTS_PER_WEEK = [
  { week: 'Mar W1', posts: 3 }, { week: 'Mar W2', posts: 5 },
  { week: 'Mar W3', posts: 4 }, { week: 'Mar W4', posts: 6 },
  { week: 'Apr W1', posts: 4 }, { week: 'Apr W2', posts: 7 },
  { week: 'Apr W3', posts: 5 }, { week: 'Apr W4', posts: 6 },
  { week: 'May W1', posts: 4 },
];

const MOCK_TOP_POSTS = [
  { id: '1', snippet: 'The best AI tool nobody is talking about...', impressions: 24800, engagement: 8.4, published: '2026-04-28' },
  { id: '2', snippet: "I built a Chrome extension in 4 hours using Claude. Here's exactly how:", impressions: 19200, engagement: 7.1, published: '2026-04-21' },
  { id: '3', snippet: 'Stop using ChatGPT like a search engine. Do this instead:', impressions: 17600, engagement: 6.8, published: '2026-05-02' },
  { id: '4', snippet: "Most people are using AI wrong. The problem isn't the tool...", impressions: 15300, engagement: 5.9, published: '2026-04-14' },
  { id: '5', snippet: 'The Claude Cowork Bootcamp just wrapped. Here\'s what I learned:', impressions: 12900, engagement: 5.2, published: '2026-04-17' },
];

// ─── Shared styles ────────────────────────────────────────
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

function StatCard({ label, value, sub, color = '#F0E4D0' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ ...panelStyle }}>
      <ScanOverlay />
      <PanelTitleBar title={label} />
      <div style={{ padding: '20px 24px' }}>
        <div style={{ color, fontSize: 32, fontFamily: "'Jura', sans-serif", fontWeight: 300, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ color: '#82C896', fontSize: 11, marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>}
      </div>
    </div>
  );
}

const customTooltipStyle = {
  background: '#1C1612', border: '1px solid #413226',
  color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
  borderRadius: 2, padding: '8px 12px',
};

const NAV_LINKS = [
  { href: '/signal', label: 'OVERVIEW' },
  { href: '/signal/posts', label: 'POSTS' },
  { href: '/signal/audience', label: 'AUDIENCE' },
  { href: '/signal/health', label: 'HEALTH' },
];

export default function SignalOverview() {
  const [range, setRange] = useState<'30' | '60' | '90'>('30');

  return (
    <div style={{ background: '#16120E', minHeight: '100vh', color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Nav */}
      <nav style={{ background: '#100E0C', borderBottom: '1px solid #413226', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 32 }}>
        <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: 10, color: '#6E604E', letterSpacing: '0.2em' }}>◈ SIGNAL</span>
        <div style={{ display: 'flex', gap: 24, fontSize: 11 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} style={{ color: href === '/signal' ? '#E8682A' : '#6E604E', textDecoration: 'none', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.15em' }}>
              {label}
            </Link>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {(['30', '60', '90'] as const).map(d => (
            <button key={d} onClick={() => setRange(d)} style={{
              padding: '4px 12px', background: range === d ? '#E8682A' : 'transparent',
              color: range === d ? '#16120E' : '#6E604E',
              border: '1px solid #413226', cursor: 'pointer',
              fontFamily: "'Silkscreen', monospace", fontSize: 8, letterSpacing: '0.1em',
            }}>{d}D</button>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          <StatCard label="TOTAL FOLLOWERS" value="6,103" sub="+1,283 last 90d" />
          <StatCard label={`POSTS LAST ${range}D`} value="32" />
          <StatCard label={`IMPRESSIONS LAST ${range}D`} value="284K" sub="+18% vs prior period" color="#FFB86C" />
          <StatCard label="AVG ENGAGEMENT" value="5.8%" sub="last 30 posts" color="#E8682A" />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 40 }}>
          {/* Follower growth */}
          <div style={{ ...panelStyle }}>
            <ScanOverlay />
            <PanelTitleBar title="FOLLOWER GROWTH" />
            <div style={{ padding: '20px 24px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={MOCK_FOLLOWER_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,50,38,0.6)" />
                  <XAxis dataKey="date" tick={{ fill: '#6E604E', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6E604E', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Line type="monotone" dataKey="followers" stroke="#82C896" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Posts per week */}
          <div style={{ ...panelStyle }}>
            <ScanOverlay />
            <PanelTitleBar title="POSTS / WEEK" />
            <div style={{ padding: '20px 24px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={MOCK_POSTS_PER_WEEK}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,50,38,0.6)" />
                  <XAxis dataKey="week" tick={{ fill: '#6E604E', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6E604E', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="posts" fill="#E8682A" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top posts */}
        <div style={{ ...panelStyle }}>
          <ScanOverlay />
          <PanelTitleBar title="TOP POSTS — LAST 30D" />
          <div style={{ padding: '0 0 4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #413226' }}>
                  {['POST', 'DATE', 'IMPRESSIONS', 'ENGAGEMENT'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6E604E', fontFamily: "'Silkscreen', monospace", fontSize: 8, letterSpacing: '0.15em', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_TOP_POSTS.map(post => (
                  <tr key={post.id} style={{ borderBottom: '1px solid rgba(65,50,38,0.5)' }}>
                    <td style={{ padding: '12px 12px', color: '#F0E4D0', maxWidth: 400 }}>
                      <Link href={`/signal/posts/${post.id}`} style={{ color: '#F0E4D0', textDecoration: 'none' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                          {post.snippet}
                        </span>
                      </Link>
                    </td>
                    <td style={{ padding: '12px 12px', color: '#B4A690', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, whiteSpace: 'nowrap' }}>{post.published}</td>
                    <td style={{ padding: '12px 12px', color: '#FFB86C', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{post.impressions.toLocaleString()}</td>
                    <td style={{ padding: '12px 12px', color: '#E8682A', fontFamily: "'JetBrains Mono', monospace" }}>{post.engagement}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: 'right', fontSize: 8, color: '#6E604E', fontFamily: "'Silkscreen', monospace", letterSpacing: '0.1em' }}>
          ⚠ MOCK DATA — connect Supabase to see live analytics
        </div>
      </div>
    </div>
  );
}
