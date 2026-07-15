'use client';

import React, { useEffect, useState } from 'react';
import Dropzone from './components/Dropzone';
import {
  CpuChipIcon,
  PhotoIcon,
  FilmIcon,
  BookOpenIcon,
  ClockIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface Asset {
  id: string;
  asset_type: 'carousel' | 'short_video' | 'newsletter';
  status: 'draft' | 'scheduled' | 'published';
  created_at: string;
  content_data: any;
}
interface Job {
  source_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

const AUTH = { Authorization: 'Bearer mock_admin_token' };

const TYPE_META: Record<Asset['asset_type'], { label: string; badge: string; Icon: typeof PhotoIcon }> = {
  carousel: { label: 'Carousel', badge: 'bg-indigo-50 border-indigo-200 text-indigo-700', Icon: PhotoIcon },
  short_video: { label: 'Reels Script', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', Icon: FilmIcon },
  newsletter: { label: 'Newsletter', badge: 'bg-amber-50 border-amber-200 text-amber-700', Icon: BookOpenIcon },
};

function title(a: Asset): string {
  const cd = a.content_data || {};
  if (a.asset_type === 'newsletter') return cd.title || 'Newsletter lesson';
  if (a.asset_type === 'carousel') return cd.slides?.[0]?.headline || 'Carousel';
  return cd.segments?.[0]?.text || 'Short-form script';
}

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/v1/assets', { headers: AUTH });
      if (res.ok) setAssets(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Poll active ingestion jobs until they finish, then refresh assets.
  useEffect(() => {
    if (jobs.length === 0) return;
    const active = jobs.some((j) => j.status === 'pending' || j.status === 'processing');
    if (!active) return;
    const interval = setInterval(async () => {
      const updated = await Promise.all(
        jobs.map(async (j) => {
          if (j.status === 'completed' || j.status === 'failed') return j;
          try {
            const res = await fetch(`/api/v1/ingest/status/${j.source_id}`, { headers: AUTH });
            if (res.ok) {
              const d = await res.json();
              return { ...j, status: d.status, progress: d.progress };
            }
          } catch {}
          return j;
        })
      );
      const justFinished = updated.some((j, i) => j.status === 'completed' && jobs[i].status !== 'completed');
      if (justFinished) fetchAssets();
      setJobs(updated);
    }, 4000);
    return () => clearInterval(interval);
  }, [jobs]);

  const handleUploadSuccess = (sourceId: string) => {
    setJobs((prev) => [...prev, { source_id: sourceId, status: 'pending', progress: 10 }]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, Sid! 👋</h1>
        <p className="mt-1 text-sm text-slate-500">Ready to repurpose some content today?</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Create New Micro-Learning Campaign</h2>
        <p className="text-sm text-slate-500 mb-6">
          Upload a webinar or lecture (MP4), lecture audio (MP3/WAV), or an ebook (PDF/TXT). EduClip transcribes it,
          extracts the concepts, and generates a full asset package.
        </p>
        <Dropzone onUploadSuccess={handleUploadSuccess} orgId="" />
      </div>

      {/* Active jobs */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CpuChipIcon className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h3 className="font-bold text-slate-900 text-base">Active Extractions</h3>
          </div>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.source_id} className="p-4 border rounded-lg bg-slate-50/50 border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-800">Source {job.source_id.slice(0, 8)}…</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      job.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : job.status === 'failed'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-indigo-100 text-indigo-700 animate-pulse'
                    }`}
                  >
                    {job.status === 'processing' ? 'Extracting concepts…' : job.status}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      job.status === 'completed' ? 'bg-green-600' : job.status === 'failed' ? 'bg-rose-600' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent assets */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Assets</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your latest generated micro-learning assets.</p>
          </div>
          <a href="/library" className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            View all <ArrowRightIcon className="w-4 h-4 ml-1" />
          </a>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-[1.2]" />
            <h3 className="font-semibold text-slate-700 text-sm">No assets yet</h3>
            <p className="text-xs text-slate-500 mt-1">Upload a file above to generate your first assets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.slice(0, 6).map((a) => {
              const meta = TYPE_META[a.asset_type];
              return (
                <div key={a.id} className="border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.badge}`}>
                        <meta.Icon className="w-3.5 h-3.5" />
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center">
                        <ClockIcon className="w-3.5 h-3.5 mr-1" />
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 line-clamp-2">{title(a)}</h4>
                  </div>
                  <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">{a.status}</span>
                    <a href={`/editor?asset_id=${a.id}`} className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                      Refine Asset <ArrowRightIcon className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
