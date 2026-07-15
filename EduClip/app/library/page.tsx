'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  PhotoIcon,
  FilmIcon,
  BookOpenIcon,
  ClockIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

interface Asset {
  id: string;
  source_id: string | null;
  asset_type: 'carousel' | 'short_video' | 'newsletter';
  status: 'draft' | 'scheduled' | 'published';
  created_at: string;
  content_data: any;
}

const TYPE_FILTERS = [
  { key: 'all', label: 'All types' },
  { key: 'carousel', label: 'Carousels' },
  { key: 'short_video', label: 'Reels Scripts' },
  { key: 'newsletter', label: 'Newsletters' },
] as const;

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'published', label: 'Published' },
] as const;

const TYPE_META: Record<Asset['asset_type'], { label: string; badge: string; Icon: typeof PhotoIcon }> = {
  carousel: { label: 'Carousel', badge: 'bg-indigo-50 border-indigo-200 text-indigo-700', Icon: PhotoIcon },
  short_video: { label: 'Reels Script', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', Icon: FilmIcon },
  newsletter: { label: 'Newsletter', badge: 'bg-amber-50 border-amber-200 text-amber-700', Icon: BookOpenIcon },
};

const STATUS_BADGE: Record<Asset['status'], string> = {
  draft: 'bg-slate-100 text-slate-600',
  scheduled: 'bg-blue-50 text-blue-700 border border-blue-100',
  published: 'bg-green-50 text-green-700 border border-green-100',
};

function assetTitle(a: Asset): string {
  const cd = a.content_data || {};
  if (a.asset_type === 'newsletter') return cd.title || 'Newsletter lesson';
  if (a.asset_type === 'carousel') return cd.slides?.[0]?.headline || 'Carousel';
  return cd.segments?.[0]?.text || 'Short-form script';
}

function assetSubtitle(a: Asset): string {
  const cd = a.content_data || {};
  if (a.asset_type === 'newsletter') return cd.tagline || cd.tl_dr || '';
  if (a.asset_type === 'carousel') return cd.slides?.[0]?.body_text || '';
  return cd.segments?.[0]?.visual_cue || '';
}

export default function LibraryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/assets', {
          headers: { Authorization: 'Bearer mock_admin_token' },
        });
        if (res.ok) setAssets(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = useMemo(() => {
    const c = { carousel: 0, short_video: 0, newsletter: 0 } as Record<Asset['asset_type'], number>;
    assets.forEach((a) => (c[a.asset_type] += 1));
    return c;
  }, [assets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (typeFilter !== 'all' && a.asset_type !== typeFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (q) {
        const hay = `${assetTitle(a)} ${assetSubtitle(a)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [assets, typeFilter, statusFilter, search]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Squares2X2Icon className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Content Library</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Every micro-learning asset you&apos;ve generated. Filter, search, and jump into the editor to refine or schedule.
        </p>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total assets', value: assets.length, cls: 'text-slate-900' },
            { label: 'Carousels', value: counts.carousel, cls: 'text-indigo-600' },
            { label: 'Reels Scripts', value: counts.short_video, cls: 'text-emerald-600' },
            { label: 'Newsletters', value: counts.newsletter, cls: 'text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  typeFilter === t.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="hidden lg:block h-6 w-px bg-slate-200" />
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === s.key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 lg:max-w-xs lg:ml-auto">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <ArrowRightIcon className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-500">Loading your library...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
            <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-[1.2]" />
            <h3 className="font-semibold text-slate-700 text-sm">
              {assets.length === 0 ? 'No assets yet' : 'No assets match your filters'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {assets.length === 0
                ? 'Upload a video, audio, or PDF on the dashboard to generate your first assets.'
                : 'Try clearing a filter or adjusting your search.'}
            </p>
          </div>
        ) : (
          <>
            <div className="text-xs text-slate-500 mb-3">
              Showing {filtered.length} of {assets.length} assets
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((a) => {
                const meta = TYPE_META[a.asset_type];
                return (
                  <div
                    key={a.id}
                    className="border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all rounded-xl p-5 flex flex-col justify-between bg-white"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.badge}`}>
                          <meta.Icon className="w-3.5 h-3.5" />
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center">
                          <ClockIcon className="w-3.5 h-3.5 mr-1" />
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 line-clamp-1">{assetTitle(a)}</h4>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{assetSubtitle(a)}</p>
                    </div>
                    <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[a.status]}`}>
                        {a.status}
                      </span>
                      <a
                        href={`/editor?asset_id=${a.id}`}
                        className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <span>Refine Asset</span>
                        <ArrowRightIcon className="w-3.5 h-3.5 ml-1" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
