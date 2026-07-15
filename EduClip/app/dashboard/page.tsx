'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Dropzone from '../components/Dropzone';
import {
  SparklesIcon,
  CircleStackIcon,
  CpuChipIcon,
  ArrowRightIcon,
  FilmIcon,
  BookOpenIcon,
  ClockIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface Asset {
  id: string;
  asset_type: 'carousel' | 'short_video' | 'newsletter';
  status: 'draft' | 'scheduled' | 'published';
  created_at: string;
  content_data: any;
}

interface IngestionJob {
  source_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  original_name: string;
}

export default function DashboardPage() {
  const [orgId, setOrgId] = useState('org_educlip_mock_999');
  const [credits, setCredits] = useState(10);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [activeJobs, setActiveJobs] = useState<IngestionJob[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  // Fetch recent assets and credits balance
  useEffect(() => {
    fetchRecentAssets();
    fetchCredits();
  }, [orgId]);

  // Pool active ingestion job status
  useEffect(() => {
    if (activeJobs.length === 0) return;

    const interval = setInterval(async () => {
      const updatedJobs = await Promise.all(
        activeJobs.map(async (job) => {
          if (job.status === 'completed' || job.status === 'failed') return job;

          try {
            const res = await fetch(`/api/v1/ingest/status/${job.source_id}`, {
              headers: { 'Authorization': 'Bearer mock_admin_token' }
            });
            if (res.ok) {
              const statusData = await res.json();
              return {
                ...job,
                status: statusData.status,
                progress: statusData.progress,
              };
            }
          } catch (err) {
            console.error('Error polling status:', err);
          }
          return job;
        })
      );

      // If any job completed, refresh recent assets list
      const finishedJob = updatedJobs.some(
        (job, idx) => job.status === 'completed' && activeJobs[idx].status !== 'completed'
      );
      if (finishedJob) {
        fetchRecentAssets();
        fetchCredits();
      }

      setActiveJobs(updatedJobs);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeJobs]);

  const fetchCredits = async () => {
    try {
      // In production, sync with database or Clerk
      const res = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': 'Bearer mock_admin_token' }
      });
      if (res.ok) {
        // Simple mock credit fetch
        setCredits(10); // Sync default
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentAssets = async () => {
    try {
      setLoadingAssets(true);
      const res = await fetch('/api/v1/assets', {
        headers: { 'Authorization': 'Bearer mock_admin_token' }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentAssets(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleUploadSuccess = (sourceId: string, creditsRemaining: number) => {
    setCredits(creditsRemaining);
    // Queue active polling job
    setActiveJobs(prev => [
      ...prev,
      {
        source_id: sourceId,
        status: 'pending',
        progress: 10,
        original_name: 'lecture_repurposed.mp4'
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-8 h-8 text-indigo-600 stroke-[1.5]" />
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">EduClip</span>
            <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">SaaS v1.0</span>
          </div>

          <div className="flex items-center space-x-6">
            <a href="/calendar" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Calendar</a>
            <a href="/editor" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Editor</a>
            
            {/* Credit Display Badge */}
            <div className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm">
              <CircleStackIcon className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">{credits} AI Credits</span>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white">
              E
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Upload and Status) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Create New Micro-Learning Campaign</h2>
              <p className="text-sm text-slate-500 mb-6">
                Upload your long-form webinars, educational Zoom videos, or textbook PDFs. EduClip extracts core concepts and generates full asset packages in minutes.
              </p>
              
              <Dropzone onUploadSuccess={handleUploadSuccess} orgId={orgId} />
            </div>

            {/* Active Extractions Panel */}
            {activeJobs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CpuChipIcon className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <h3 className="font-bold text-slate-900 text-base">Active Content Extractions</h3>
                </div>
                
                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <div key={job.source_id} className="p-4 border rounded-lg bg-slate-50/50 border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-800 truncate max-w-sm">
                          {job.original_name}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          job.status === 'completed' ? 'bg-green-100 text-green-700' :
                          job.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                          'bg-indigo-100 text-indigo-700 animate-pulse'
                        }`}>
                          {job.status === 'processing' ? 'Isolating Concepts...' : job.status}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            job.status === 'completed' ? 'bg-green-600' :
                            job.status === 'failed' ? 'bg-rose-600' : 'bg-indigo-600 animate-pulse'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>S3 Source Reference ID: {job.source_id.slice(0, 8)}...</span>
                        <span>{job.progress}% progress</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Sidebar metrics & instructions) */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl shadow-md border border-slate-800 p-6">
              <h3 className="text-lg font-bold flex items-center space-x-2">
                <SparklesIcon className="w-5 h-5 text-amber-400" />
                <span>The Repurposing Blueprint</span>
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                We ingest your long content and execute a three-step Map-Reduce synthesis engine.
              </p>

              <div className="mt-6 space-y-4 text-xs text-slate-200">
                <div className="flex space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 border border-slate-700">1</div>
                  <div>
                    <strong className="text-white">Direct S3 Ingest:</strong> Upload large webinars with zero payload bottleneck.
                  </div>
                </div>

                <div className="flex space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 border border-slate-700">2</div>
                  <div>
                    <strong className="text-white">Semantic AI Extraction:</strong> Split lecture chunks cleanly at boundary shifts using Gemini embeddings.
                  </div>
                </div>

                <div className="flex space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 border border-slate-700">3</div>
                  <div>
                    <strong className="text-white">Platform Adaption:</strong> Re-author educational summaries into LinkedIn Carousels (PDF), Shorts scripts, and Newsletters in parallel.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Recent Assets */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recent Generated Micro-Learning Assets</h2>
              <p className="text-xs text-slate-500 mt-0.5">Edit, adjust styles, and schedule your social media presence.</p>
            </div>
            
            <a href="/editor" className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              <span>Open Campaign Editor</span>
              <ArrowRightIcon className="w-4 h-4 ml-1.5" />
            </a>
          </div>

          {loadingAssets ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <ArrowRightIcon className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm text-slate-500">Retrieving asset list...</p>
            </div>
          ) : recentAssets.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-[1.2]" />
              <h3 className="font-semibold text-slate-700 text-sm">No assets generated yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Upload your first educational recording above and let our Concept Extraction engine build your social media pipeline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentAssets.map((asset) => (
                <div key={asset.id} className="border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        asset.asset_type === 'carousel' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' :
                        asset.asset_type === 'short_video' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                        'bg-amber-50 border border-amber-200 text-amber-700'
                      }`}>
                        {asset.asset_type === 'carousel' && <PhotoIcon className="w-3.5 h-3.5" />}
                        {asset.asset_type === 'short_video' && <FilmIcon className="w-3.5 h-3.5" />}
                        {asset.asset_type === 'newsletter' && <BookOpenIcon className="w-3.5 h-3.5" />}
                        <span className="capitalize">{asset.asset_type === 'short_video' ? 'Reels Script' : asset.asset_type}</span>
                      </span>
                      
                      <span className="text-[10px] text-slate-400 flex items-center">
                        <ClockIcon className="w-3.5 h-3.5 mr-1" />
                        {new Date(asset.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 line-clamp-1">
                      {asset.asset_type === 'newsletter' ? asset.content_data?.title : asset.content_data?.slides?.[0]?.headline || asset.content_data?.segments?.[0]?.text || 'Educational Lesson'}
                    </h4>
                    
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {asset.asset_type === 'newsletter' ? asset.content_data?.tagline : asset.content_data?.slides?.[0]?.body_text || asset.content_data?.segments?.[0]?.visual_cue || 'Visual script summary'}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${
                      asset.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                      asset.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      {asset.status}
                    </span>
                    
                    <a
                      href={`/editor?asset_id=${asset.id}`}
                      className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <span>Refine Asset</span>
                      <ArrowRightIcon className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
