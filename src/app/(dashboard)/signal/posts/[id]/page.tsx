'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getActiveProfileId, getPostDetailData, type PostDetailData } from '@/lib/signal-data';

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
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [p, setP] = useState<PostDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      const supabase = createClient();
      const profileId = await getActiveProfileId(supabase);
      if (cancelled) return;
      if (!profileId) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const d = await getPostDetailData(supabase, profileId, id);
      if (cancelled) return;
      if (!d) {
        setNotFound(true);
      } else {
        setP(d);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading || !p) {
    return (
      <div style={{ background: '#16120E', minHeight: '100vh', color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace" }}>
        <nav style={{ background: '#100E0C', borderBottom: '1px solid #413226', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/signal" style={{ fontFamily: "'Silkscreen', monospace", fontSize: 10, color: '#6E604E', letterSpacing: '0.2em', textDecoration: 'none' }}>◈ SIGNAL</Link>
          <span style={{ color: '#413226' }}>/</span>
          <Link href="/signal/posts" style={{ color: '#6E604E', textDecoration: 'none', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.15em' }}>POSTS</Link>
          <span style={{ color: '#413226' }}>/</span>
          <span style={{ color: '#E8682A', fontFamily: "'Silkscreen', monospace", fontSize: 9 }}>DETAIL</span>
        </nav>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: '#B4A690', fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>
          {notFound ? 'Post not found.' : 'LOADING…'}
        </div>
      </div>
    );
  }

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

            {/* Demographics (audience-level) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <DemoTable title="JOB TITLES" data={p.demographics.job_title} />
              <DemoTable title="INDUSTRIES" data={p.demographics.industry} />
              <DemoTable title="LOCATIONS" data={p.demographics.location} />
            </div>
          </div>

          {/* Right column — metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'IMPRESSIONS', value: p.impressions.toLocaleString(), color: '#FFB86C' },
              { label: 'ENGAGEMENT RATE', value: `${p.engagement}%`, color: '#E8682A' },
              { label: 'COMMENTS', value: String(p.comments), color: '#F0E4D0' },
              { label: 'REPOSTS', value: String(p.reposts), color: '#F0E4D0' },
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
                <ReactionBar label="Total" count={p.reactions_total} total={p.reactions_total} color="#FFB86C" />
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: 8, color: '#6E604E', fontFamily: "'Silkscreen', monospace", letterSpacing: '0.1em' }}>◈ LIVE DATA</div>
      </div>
    </div>
  );
}
