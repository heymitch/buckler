'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { getActiveProfileId, getOverviewData, type OverviewData } from '@/lib/signal-data';

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

function formatK(n: number): string {
  if (n >= 1000) return `${Math.round(n / 100) / 10}K`;
  return String(n);
}

export default function SignalOverview() {
  const [range, setRange] = useState<'30' | '60' | '90'>('30');
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const profileId = await getActiveProfileId(supabase);
      if (cancelled) return;
      if (!profileId) {
        setEmpty(true);
        setLoading(false);
        return;
      }
      const d = await getOverviewData(supabase, profileId);
      if (cancelled) return;
      setData(d);
      setEmpty(d.followerGrowth.length === 0 && d.topPosts.length === 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const followerGrowth = data?.followerGrowth ?? [];
  const postsPerWeek = data?.postsPerWeek ?? [];
  const topPosts = data?.topPosts ?? [];

  const postsForRange =
    range === '30' ? data?.postsLast30 : range === '60' ? data?.postsLast60 : data?.postsLast90;
  const impressionsForRange =
    range === '30'
      ? data?.impressionsLast30
      : range === '60'
        ? data?.impressionsLast60
        : data?.impressionsLast90;
  const deltaForRange =
    range === '30'
      ? data?.impressionsDeltaPct30
      : range === '60'
        ? data?.impressionsDeltaPct60
        : data?.impressionsDeltaPct90;

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
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#6E604E', fontFamily: "'Silkscreen', monospace", fontSize: 10, letterSpacing: '0.15em' }}>
            LOADING…
          </div>
        )}

        {!loading && empty && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#B4A690', fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>
            No data yet — import or connect to get started.
          </div>
        )}

        {!loading && !empty && (<>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          <StatCard label="TOTAL FOLLOWERS" value={(data?.totalFollowers ?? 0).toLocaleString()} sub={`+${(data?.followerDelta90d ?? 0).toLocaleString()} last 90d`} />
          <StatCard label={`POSTS LAST ${range}D`} value={String(postsForRange ?? 0)} />
          <StatCard label={`IMPRESSIONS LAST ${range}D`} value={formatK(impressionsForRange ?? 0)} sub={`${(deltaForRange ?? 0) >= 0 ? '+' : ''}${deltaForRange ?? 0}% vs prior period`} color="#FFB86C" />
          <StatCard label="AVG ENGAGEMENT" value={`${data?.avgEngagementLast30 ?? 0}%`} sub="last 30 posts" color="#E8682A" />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 40 }}>
          {/* Follower growth */}
          <div style={{ ...panelStyle }}>
            <ScanOverlay />
            <PanelTitleBar title="FOLLOWER GROWTH" />
            <div style={{ padding: '20px 24px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={followerGrowth}>
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
                <BarChart data={postsPerWeek}>
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
                {topPosts.map(post => (
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
          ◈ LIVE DATA
        </div>
        </>)}
      </div>
    </div>
  );
}
