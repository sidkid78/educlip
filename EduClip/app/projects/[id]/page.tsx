'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Dropzone from '../../components/Dropzone';
import {
  FolderIcon,
  PhotoIcon,
  FilmIcon,
  BookOpenIcon,
  ClockIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string | null;
  source_count: number;
  asset_count: number;
}
interface Asset {
  id: string;
  asset_type: 'carousel' | 'short_video' | 'newsletter';
  status: 'draft' | 'scheduled' | 'published';
  created_at: string;
  content_data: any;
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

export default function ProjectDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [processing, setProcessing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAssets = useCallback(async () => {
    const [pRes, aRes] = await Promise.all([
      fetch(`/api/v1/projects/${id}`, { headers: AUTH }),
      fetch(`/api/v1/projects/${id}/assets`, { headers: AUTH }),
    ]);
    if (pRes.ok) setProject(await pRes.json());
    if (aRes.ok) setAssets(await aRes.json());
  }, [id]);

  useEffect(() => {
    loadAssets();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadAssets]);

  const handleUploadSuccess = () => {
    // Poll for generated assets while background processing runs.
    setProcessing(true);
    let ticks = 0;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      ticks += 1;
      const before = assets.length;
      await loadAssets();
      setAssets((cur) => {
        if (cur.length > before || ticks > 24) {
          if (pollRef.current) clearInterval(pollRef.current);
          setProcessing(false);
        }
        return cur;
      });
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a href="/projects" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-4">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> All projects
        </a>

        <div className="flex items-start gap-3 mb-6">
          <div className="w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <FolderIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{project?.name || 'Project'}</h1>
            <p className="text-sm text-slate-500">{project?.description || 'No description'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-900 mb-1">Add source content</h2>
              <p className="text-xs text-slate-500 mb-4">Files you upload here are tagged to this project.</p>
              <Dropzone onUploadSuccess={handleUploadSuccess} orgId="" projectId={id} />
              {processing && (
                <p className="text-xs text-indigo-600 mt-3 animate-pulse">Processing upload — assets will appear below…</p>
              )}
            </div>
          </div>

          {/* Assets */}
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-slate-900 mb-3">
              Generated assets <span className="text-slate-400 font-normal">({assets.length})</span>
            </h2>
            {assets.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-xl border border-dashed border-slate-200">
                <PhotoIcon className="w-10 h-10 text-slate-400 mx-auto mb-2 stroke-[1.2]" />
                <p className="text-sm text-slate-600 font-medium">No assets yet</p>
                <p className="text-xs text-slate-500 mt-1">Upload a video, audio, or PDF to generate assets for this project.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assets.map((a) => {
                  const meta = TYPE_META[a.asset_type];
                  return (
                    <div key={a.id} className="bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.badge}`}>
                            <meta.Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {new Date(a.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-2">{title(a)}</h4>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{a.status}</span>
                        <a href={`/editor?asset_id=${a.id}`} className="inline-flex items-center text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">
                          Refine <ArrowRightIcon className="w-3 h-3 ml-0.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
