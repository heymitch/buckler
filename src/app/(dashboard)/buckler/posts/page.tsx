'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getActiveProfileId, getPostsData, type PostRow } from '@/lib/buckler-data';

const SCAN_LINE = 'repeating-linear-gradient(to bottom, transparent 0px, transparent 4px, rgba(28,22,18,0.4) 4px, rgba(28,22,18,0.4) 5px)';

type SortKey = 'published' | 'impressions' | 'engagement' | 'comments' | 'reactions';

const NAV_LINKS = [
  { href: '/buckler', label: 'OVERVIEW' },
  { href: '/buckler/posts', label: 'POSTS' },
  { href: '/buckler/audience', label: 'AUDIENCE' },
  { href: '/buckler/health', label: 'HEALTH' },
];

export default function PostsPage() {
  const [sort, setSort] = useState<SortKey>('impressions');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('');
  const [allPosts, setAllPosts] = useState<PostRow[]>([]);
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
      const rows = await getPostsData(supabase, profileId);
      if (cancelled) return;
      setAllPosts(rows);
      setEmpty(rows.length === 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSort(key: SortKey) {
    if (sort === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(key); setSortDir('desc'); }
  }

  const posts = [...allPosts]
    .filter(p => !filter || p.snippet.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const av = sort === 'published' ? a.published : (a[sort] as number);
      const bv = sort === 'published' ? b.published : (b[sort] as number);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const SortHeader = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <th onClick={() => handleSort(sortKey)} style={{ padding: '8px 12px', textAlign: 'left', color: sort === sortKey ? '#E8682A' : '#6E604E', fontFamily: "'Silkscreen', monospace", fontSize: 8, letterSpacing: '0.15em', fontWeight: 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label} {sort === sortKey ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  );

  return (
    <div style={{ background: '#16120E', minHeight: '100vh', color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace" }}>
      <nav style={{ background: '#100E0C', borderBottom: '1px solid #413226', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href="/buckler" style={{ fontFamily: "'Silkscreen', monospace", fontSize: 10, color: '#6E604E', letterSpacing: '0.2em', textDecoration: 'none' }}>◈ BUCKLER</Link>
        <div style={{ display: 'flex', gap: 24 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} style={{ color: href === '/buckler/posts' ? '#E8682A' : '#6E604E', textDecoration: 'none', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.15em' }}>{label}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 300, margin: 0, fontFamily: "'Jura', sans-serif", color: '#F0E4D0' }}>Posts</h1>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="search posts..."
            style={{ padding: '8px 14px', background: 'rgba(240,228,208,0.04)', border: '1px solid #413226', color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, width: 240, outline: 'none' }}
          />
        </div>

        <div style={{ background: '#1C1612', border: '1px solid #413226', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
          {/* Scan line overlay */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: SCAN_LINE, zIndex: 1 }} />
          {/* Panel title bar */}
          <div style={{ background: '#100E0C', borderBottom: '1px solid #413226', padding: '6px 12px', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.2em', color: '#6E604E' }}>
            ALL POSTS
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #413226' }}>
                <SortHeader label="POST" sortKey="published" />
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6E604E', fontFamily: "'Silkscreen', monospace", fontSize: 8, letterSpacing: '0.15em', fontWeight: 400 }}>TYPE</th>
                <SortHeader label="PUBLISHED" sortKey="published" />
                <SortHeader label="IMPRESSIONS" sortKey="impressions" />
                <SortHeader label="REACTIONS" sortKey="reactions" />
                <SortHeader label="COMMENTS" sortKey="comments" />
                <SortHeader label="ENGAGEMENT" sortKey="engagement" />
              </tr>
            </thead>
            <tbody>
              {(loading || empty) && (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 12px', textAlign: 'center', color: '#B4A690', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                    {loading ? 'LOADING…' : 'No data yet — import or connect to get started.'}
                  </td>
                </tr>
              )}
              {!loading && !empty && posts.map(post => (
                <tr key={post.id} style={{ borderBottom: '1px solid rgba(65,50,38,0.5)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(55,43,32,0.4)'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '14px 12px', maxWidth: 340 }}>
                    <Link href={`/buckler/posts/${post.id}`} style={{ color: '#F0E4D0', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                      {post.snippet}
                    </Link>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ padding: '2px 8px', background: 'rgba(65,50,38,0.5)', borderRadius: 2, fontFamily: "'Silkscreen', monospace", fontSize: 8, color: '#B4A690', letterSpacing: '0.1em' }}>{post.type.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '14px 12px', color: '#B4A690', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{post.published}</td>
                  <td style={{ padding: '14px 12px', color: '#FFB86C', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{post.impressions.toLocaleString()}</td>
                  <td style={{ padding: '14px 12px', color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace" }}>{post.reactions}</td>
                  <td style={{ padding: '14px 12px', color: '#F0E4D0', fontFamily: "'JetBrains Mono', monospace" }}>{post.comments}</td>
                  <td style={{ padding: '14px 12px', color: '#E8682A', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{post.engagement}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, textAlign: 'right', fontSize: 8, color: '#6E604E', fontFamily: "'Silkscreen', monospace", letterSpacing: '0.1em' }}>◈ LIVE DATA</div>
      </div>
    </div>
  );
}
