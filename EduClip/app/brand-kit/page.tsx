'use client';

import React, { useEffect, useState } from 'react';
import BrandKit, { BrandKitConfig } from '../components/BrandKit';
import { PaintBrushIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function BrandKitPage() {
  const [config, setConfig] = useState<BrandKitConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/brand', {
          headers: { Authorization: 'Bearer mock_admin_token' },
        });
        if (res.ok) setConfig(await res.json());
        else setConfig({ primary_color: '#4F46E5', bg_color: '#FFFFFF', font_family: 'Inter, sans-serif', creator_handle: 'my_academy' });
      } catch {
        setConfig({ primary_color: '#4F46E5', bg_color: '#FFFFFF', font_family: 'Inter, sans-serif', creator_handle: 'my_academy' });
      }
    })();
  }, []);

  const handleSave = async (next: BrandKitConfig) => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/v1/brand', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock_admin_token' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      setConfig(await res.json());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-1">
          <PaintBrushIcon className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Brand Kit</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Set your colors, font, and handle. These are applied to every carousel EduClip generates.
        </p>

        {config === null ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <ArrowPathIcon className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-500">Loading your brand kit...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Editor */}
            <div>
              <BrandKit initialConfig={config} onSave={handleSave} />
              <div className="mt-3 h-6 flex items-center text-sm">
                {saving && <span className="text-slate-500">Saving…</span>}
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                    <CheckCircleIcon className="w-4 h-4" /> Saved — new carousels will use these styles.
                  </span>
                )}
                {error && <span className="text-rose-600">{error}</span>}
              </div>
            </div>

            {/* Live preview of the applied brand */}
            <div className="lg:sticky lg:top-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Carousel preview (applied styles)
              </label>
              <div
                className="aspect-[4/5] rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col p-8"
                style={{ backgroundColor: config.bg_color, fontFamily: config.font_family }}
              >
                <div
                  className="text-[11px] font-bold uppercase tracking-wider mb-4"
                  style={{ color: config.primary_color }}
                >
                  Step 1 of 5
                </div>
                <h3
                  className="text-3xl font-extrabold leading-tight"
                  style={{ color: isDark(config.bg_color) ? '#FFFFFF' : '#0F172A' }}
                >
                  Stop guessing.{' '}
                  <span style={{ color: config.primary_color }}>Start compounding.</span>
                </h3>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: isDark(config.bg_color) ? '#CBD5E1' : '#475569' }}
                >
                  The single biggest mistake beginners make is waiting too long to start.
                </p>
                <div className="mt-auto flex items-center gap-2.5 pt-6">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    {(config.creator_handle || '?').charAt(0).toUpperCase()}
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: isDark(config.bg_color) ? '#E2E8F0' : '#334155' }}
                  >
                    @{config.creator_handle}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/** Rough luminance check so preview text stays legible on dark backgrounds. */
function isDark(hex: string): boolean {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return false;
  const [r, g, b] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  return (0.299 * r + 0.587 * g + 0.114 * b) < 140;
}
