'use client';

import React, { useState } from 'react';
import {
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface LivePreviewProps {
  assetType: 'carousel' | 'short_video' | 'newsletter';
  contentData: any;
  brandKit: {
    primary_color: string;
    bg_color: string;
    font_family: string;
    creator_handle: string;
  };
}

export default function LivePreview({ assetType, contentData, brandKit }: LivePreviewProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlayingScript, setIsPlayingScript] = useState(false);
  const [activeSegment, setActiveSegment] = useState(0);

  if (!contentData) {
    return (
      <div className="bg-slate-100 rounded-xl border border-slate-200 h-[480px] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Select an asset to view its live visual preview.</p>
      </div>
    );
  }

  const renderCarousel = () => {
    const slides = contentData.slides || [];
    if (slides.length === 0) return <p className="text-slate-400">No slides found.</p>;
    const slide = slides[activeSlide];

    return (
      <div className="flex flex-col items-center">
        {/* Dynamic Canvas Container (replicates Satori + Resvg) */}
        <div
          className="w-full max-w-[360px] aspect-[4/5] rounded-xl shadow-lg border border-slate-200 p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden"
          style={{
            backgroundColor: brandKit.bg_color,
            color: brandKit.bg_color === '#FFFFFF' || brandKit.bg_color === '#FAFAFA' ? '#1E293B' : '#FAFAFA',
            fontFamily: brandKit.font_family,
          }}
        >
          {/* Header watermark */}
          <div className="flex items-center justify-between text-[11px] opacity-60 font-semibold tracking-wider">
            <span>EduClip Academy</span>
            <SparklesIcon className="w-4 h-4" style={{ color: brandKit.primary_color }} />
          </div>

          {/* Central message */}
          <div className="space-y-4 my-auto">
            {slide.step_number && (
              <span
                className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full inline-block mb-1 border"
                style={{
                  color: brandKit.primary_color,
                  borderColor: `${brandKit.primary_color}30`,
                  backgroundColor: `${brandKit.primary_color}10`,
                }}
              >
                {slide.step_number}
              </span>
            )}
            {slide.headline && (
              <h3 className="text-xl sm:text-2xl font-bold leading-tight" style={{ color: slide.slide_type === 'hook_slide' ? brandKit.primary_color : undefined }}>
                {slide.headline}
              </h3>
            )}
            {slide.body_text && (
              <p className="text-sm opacity-85 leading-relaxed font-normal">
                {slide.body_text}
              </p>
            )}
          </div>

          {/* Footer watermark */}
          <div className="flex items-center justify-between border-t pt-4 opacity-75 border-slate-100 text-[11px] font-medium">
            <span>@{brandKit.creator_handle}</span>
            <span className="opacity-60">{activeSlide + 1} / {slides.length}</span>
          </div>
        </div>

        {/* Slide Controls */}
        <div className="flex items-center space-x-4 mt-5">
          <button
            type="button"
            disabled={activeSlide === 0}
            onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
            className="p-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronLeftIcon className="w-5 h-5 text-slate-700" />
          </button>
          <span className="text-sm font-semibold text-slate-600">Slide {activeSlide + 1} of {slides.length}</span>
          <button
            type="button"
            disabled={activeSlide === slides.length - 1}
            onClick={() => setActiveSlide(prev => Math.min(slides.length - 1, prev + 1))}
            className="p-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronRightIcon className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>
    );
  };

  const renderVideoScript = () => {
    const segments = contentData.segments || [];
    if (segments.length === 0) return <p className="text-slate-400">No script segments found.</p>;
    const segment = segments[activeSegment];

    return (
      <div className="flex flex-col items-center">
        {/* TikTok/Reels Mobile Preview Card */}
        <div className="w-full max-w-[280px] aspect-[9/16] bg-slate-950 rounded-2xl shadow-xl overflow-hidden relative border border-slate-800 flex flex-col justify-between p-4 text-white">
          
          {/* Top Bar Indicators */}
          <div className="flex justify-between items-center text-[10px] text-white/60">
            <span>Following</span>
            <span className="font-bold border-b border-white pb-0.5 text-white">For You</span>
            <span className="w-4" />
          </div>

          {/* Center visual cue emulation */}
          <div className="flex flex-col items-center text-center justify-center flex-1 my-4 p-2 bg-black/40 backdrop-blur-[2px] border border-white/5 rounded-lg">
            <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase mb-1">Visual B-Roll / Action Cue</span>
            <p className="text-xs text-white/90 italic line-clamp-4 leading-relaxed">
              &ldquo;{segment.visual_cue}&rdquo;
            </p>
          </div>

          {/* On-screen text caption Overlay */}
          <div className="space-y-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 rounded-b-lg">
            <div className="bg-amber-400/90 text-slate-950 px-3 py-1.5 rounded text-center font-bold text-xs shadow-md animate-pulse">
              {segment.role === 'hook' ? '🔥 THE HOOK' : segment.role === 'body' ? '💎 VALUE SHIFT' : '🚀 NEXT STEPS (CTA)'}
            </div>
            
            {/* Subtitles text */}
            <p className="text-xs leading-normal font-medium text-white line-clamp-3">
              {segment.text}
            </p>

            <div className="flex items-center space-x-2 text-[10px] text-white/70">
              <span className="font-semibold text-white">@{brandKit.creator_handle}</span>
              <span>•</span>
              <span>Duration: {segment.duration}</span>
            </div>
          </div>
        </div>

        {/* Script playback controller */}
        <div className="flex items-center justify-center space-x-4 mt-5">
          <button
            type="button"
            onClick={() => setActiveSegment(prev => (prev > 0 ? prev - 1 : segments.length - 1))}
            className="text-xs font-medium px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            Prev
          </button>
          
          <button
            type="button"
            onClick={() => setIsPlayingScript(!isPlayingScript)}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors shadow-sm"
          >
            {isPlayingScript ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveSegment(prev => (prev < segments.length - 1 ? prev + 1 : 0))}
            className="text-xs font-medium px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Segment {activeSegment + 1} of {segments.length} ({segment.role.toUpperCase()})</p>
      </div>
    );
  };

  const renderNewsletter = () => {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 max-h-[500px] overflow-y-auto text-slate-800 font-sans shadow-inner">
        <div className="border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <DocumentTextIcon className="w-4 h-4" />
            <span>Newsletter Lesson Broadcast</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">{contentData.title || 'Lesson Title'}</h1>
          <p className="text-sm text-slate-500 italic mt-1">{contentData.tagline || 'Punchy educational tagline'}</p>
        </div>

        {/* TL;DR section */}
        {contentData.tl_dr && (
          <div className="bg-slate-50 border-l-4 border-indigo-500 p-3 rounded-r-md text-sm italic text-slate-600 mb-5">
            <strong>TL;DR Summary:</strong> {contentData.tl_dr}
          </div>
        )}

        {/* Markdown breakdown rendering */}
        <div className="prose prose-sm prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-4">
          {contentData.breakdown_markdown ? (
            contentData.breakdown_markdown.split('\n').map((line: string, idx: number) => {
              if (line.startsWith('## ')) {
                return <h2 key={idx} className="text-base font-bold text-slate-950 mt-4 mb-2">{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={idx} className="text-sm font-semibold text-slate-900 mt-3 mb-1">{line.replace('### ', '')}</h3>;
              }
              if (line.startsWith('- ')) {
                return <li key={idx} className="ml-4 list-disc text-slate-600 my-0.5">{line.replace('- ', '')}</li>;
              }
              if (line.trim() === '') {
                return <div key={idx} className="h-2" />;
              }
              return <p key={idx} className="my-1">{line}</p>;
            })
          ) : (
            <p className="text-slate-400">Lesson body text is empty.</p>
          )}
        </div>

        {/* Action item section */}
        {contentData.action_item_markdown && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 mt-6 text-sm">
            <h4 className="font-bold text-indigo-900 flex items-center space-x-1.5 mb-1.5">
              <span>🛠️ Practical Action Item</span>
            </h4>
            <div className="text-indigo-950/80 leading-relaxed font-normal">
              {contentData.action_item_markdown.replace('### 🛠️ Your 5-Minute Action Step', '').replace('### 🛠️ Put it into practice', '')}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
        <h3 className="font-semibold text-slate-700 text-sm tracking-wide uppercase">High-Fidelity Preview</h3>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-600 font-medium capitalize">
          {assetType === 'short_video' ? 'Reels Script' : assetType}
        </span>
      </div>

      {assetType === 'carousel' && renderCarousel()}
      {assetType === 'short_video' && renderVideoScript()}
      {assetType === 'newsletter' && renderNewsletter()}
    </div>
  );
}
