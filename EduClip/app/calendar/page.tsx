'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PhotoIcon,
  FilmIcon,
  BookOpenIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface Asset {
  id: string;
  asset_type: 'carousel' | 'short_video' | 'newsletter';
  content_data: any;
  status: 'draft' | 'scheduled' | 'published';
  created_at: string;
}
interface Publication {
  id: string;
  asset_id: string;
  platform: string;
  status: 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  publish_at: string;
  external_post_id: string | null;
}
interface PlatformInfo {
  name: string;
  asset_types: string[];
}

const AUTH = { Authorization: 'Bearer mock_admin_token' };

const TYPE_ICON: Record<Asset['asset_type'], typeof PhotoIcon> = {
  carousel: PhotoIcon,
  short_video: FilmIcon,
  newsletter: BookOpenIcon,
};
const TYPE_TINT: Record<Asset['asset_type'], string> = {
  carousel: 'bg-indigo-50 text-indigo-700',
  short_video: 'bg-emerald-50 text-emerald-700',
  newsletter: 'bg-amber-50 text-amber-700',
};
const PUB_STATUS: Record<Publication['status'], string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-100',
  publishing: 'bg-amber-50 text-amber-700 border-amber-100',
  published: 'bg-green-50 text-green-700 border-green-100',
  failed: 'bg-rose-50 text-rose-700 border-rose-100',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

/** Backend stores naive UTC; append 'Z' so the browser converts to local correctly. */
function parsePub(ts: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(ts) ? ts : ts + 'Z');
}

function assetTitle(a?: Asset): string {
  if (!a) return 'Asset';
  const cd = a.content_data || {};
  if (a.asset_type === 'newsletter') return cd.title || 'Newsletter';
  if (a.asset_type === 'carousel') return cd.slides?.[0]?.headline || 'Carousel';
  return cd.segments?.[0]?.text || 'Reels Script';
}

export default function CalendarPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [platforms, setPlatforms] = useState<Record<string, PlatformInfo>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const fetchAll = async () => {
    const [aRes, pRes, plRes] = await Promise.all([
      fetch('/api/v1/assets', { headers: AUTH }),
      fetch('/api/v1/distribution', { headers: AUTH }),
      fetch('/api/v1/distribution/platforms', { headers: AUTH }),
    ]);
    if (aRes.ok) setAssets(await aRes.json());
    if (pRes.ok) setPublications(await pRes.json());
    if (plRes.ok) setPlatforms(await plRes.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const assetMap = useMemo(() => {
    const m: Record<string, Asset> = {};
    assets.forEach((a) => (m[a.id] = a));
    return m;
  }, [assets]);

  const validPlatformsFor = (assetType?: string) =>
    Object.entries(platforms).filter(([, meta]) => !assetType || meta.asset_types.includes(assetType));

  // Side deck = assets not yet scheduled to any platform.
  const unscheduled = assets.filter((a) => a.status === 'draft');

  const getWeekDays = () => {
    const days: Date[] = [];
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };
  const weekDays = getWeekDays();

  const pubsForDay = (date: Date) =>
    publications.filter((p) => parsePub(p.publish_at).toDateString() === date.toDateString());

  const selectAsset = (a: Asset) => {
    setSelectedAssetId(a.id);
    const valid = validPlatformsFor(a.asset_type);
    setSelectedPlatform(valid.length ? valid[0][0] : '');
  };

  const scheduleOnDay = async (date: Date) => {
    if (!selectedAssetId || !selectedPlatform) return;
    setBusy(true);
    try {
      const when = new Date(date);
      when.setHours(9, 0, 0, 0);
      const res = await fetch('/api/v1/distribution/schedule', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: selectedAssetId, platform: selectedPlatform, publish_at: when.toISOString() }),
      });
      if (res.ok) {
        setSelectedAssetId(null);
        setSelectedPlatform('');
        await fetchAll();
      }
    } finally {
      setBusy(false);
    }
  };

  const runDue = async () => {
    setBusy(true);
    try {
      await fetch('/api/v1/distribution/run-due', { method: 'POST', headers: AUTH });
      await fetchAll();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <ArrowPathIcon className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-600 text-sm font-medium">Loading Campaign Calendar…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <a href="/" className="p-1 text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
          </a>
          <span className="h-4 w-px bg-slate-200" />
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-800 text-sm">Distribution Calendar</span>
          </div>
        </div>
        <button
          onClick={runDue}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
          Publish due now
        </button>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Calendar grid */}
          <div className="xl:col-span-9 bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">This Week&apos;s Schedule</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedAssetId
                    ? 'Now pick a day to schedule the selected asset for publishing.'
                    : 'Select an asset from the side deck, choose a platform, then place it on a day.'}
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">
                {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
                {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map((day, idx) => {
                const dayPubs = pubsForDay(day);
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={idx}
                    onClick={() => selectedAssetId && scheduleOnDay(day)}
                    className={`border rounded-xl p-3 min-h-[420px] transition-all flex flex-col ${
                      isToday
                        ? 'bg-indigo-50/20 border-indigo-300 ring-2 ring-indigo-500/10'
                        : selectedAssetId
                        ? 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/5 cursor-pointer hover:shadow-inner'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b pb-2 mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {day.toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                      <span className={`text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700'}`}>
                        {day.getDate()}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {dayPubs.map((p) => {
                        const a = assetMap[p.asset_id];
                        const Icon = a ? TYPE_ICON[a.asset_type] : PhotoIcon;
                        return (
                          <div key={p.id} className="p-3 border rounded-lg shadow-sm bg-white border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`p-1 rounded-md ${a ? TYPE_TINT[a.asset_type] : 'bg-slate-50 text-slate-600'}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-[9px] text-slate-400 font-semibold flex items-center">
                                <ClockIcon className="w-3 h-3 mr-0.5" />
                                {parsePub(p.publish_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{assetTitle(a)}</h4>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-slate-600">
                                {platforms[p.platform]?.name || p.platform}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${PUB_STATUS[p.status]}`}>
                                {p.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selectedAssetId && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); scheduleOnDay(day); }}
                        className="w-full py-1.5 border border-dashed border-indigo-400 bg-indigo-50/50 hover:bg-indigo-100/50 text-[10px] font-bold text-indigo-600 rounded-lg transition-colors mt-auto"
                      >
                        Schedule here
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side deck */}
          <div className="xl:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5 flex flex-col">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Ready to Distribute</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Select an asset, pick a platform, then click a day to schedule a publication.
              </p>
            </div>

            <div className="flex-1 space-y-4 max-h-[620px] overflow-y-auto pr-1">
              {unscheduled.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-lg bg-slate-50">
                  <CheckCircleIcon className="w-10 h-10 text-slate-400 mx-auto mb-2 stroke-[1.2]" />
                  <p className="text-xs font-semibold text-slate-600">Everything is scheduled</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">No draft assets left to distribute.</p>
                </div>
              ) : (
                unscheduled.map((asset) => {
                  const Icon = TYPE_ICON[asset.asset_type];
                  const selected = selectedAssetId === asset.id;
                  const valid = validPlatformsFor(asset.asset_type);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => selectAsset(asset)}
                      className={`p-3.5 border rounded-lg shadow-sm transition-all cursor-pointer ${
                        selected ? 'ring-2 ring-indigo-500 bg-indigo-50/20 border-indigo-200' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${TYPE_TINT[asset.asset_type]} border border-current/10`}>
                          <Icon className="w-3 h-3" />
                          <span className="capitalize">{asset.asset_type === 'short_video' ? 'Reels' : asset.asset_type}</span>
                        </span>
                        <span className="text-[9px] font-bold uppercase text-slate-400">{asset.status}</span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{assetTitle(asset)}</h4>

                      {selected && (
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Platform</label>
                          <select
                            value={selectedPlatform}
                            onChange={(e) => setSelectedPlatform(e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded-md py-1.5 px-2 focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            {valid.map(([key, meta]) => (
                              <option key={key} value={key}>{meta.name}</option>
                            ))}
                          </select>
                          <p className="text-[10px] text-indigo-600 font-semibold mt-2">
                            {busy ? 'Scheduling…' : '↑ Now click a day above to schedule.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
