'use client';

import React, { useState } from 'react';
import { SparklesIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

export interface BrandKitConfig {
  primary_color: string;
  bg_color: string;
  font_family: string;
  creator_handle: string;
}

interface BrandKitProps {
  initialConfig?: BrandKitConfig;
  onSave: (config: BrandKitConfig) => void;
}

const PRESET_PALETTES = [
  { name: 'Indigo Dream', primary: '#4F46E5', bg: '#FFFFFF' },
  { name: 'Warm Sunset', primary: '#EA580C', bg: '#FDF8F5' },
  { name: 'Emerald Forest', primary: '#059669', bg: '#F0FDF4' },
  { name: 'Midnight Neon', primary: '#EC4899', bg: '#0F172A' },
  { name: 'Minimal Obsidian', primary: '#1E293B', bg: '#FAFAFA' },
];

const FONTS = [
  { name: 'Inter (Sans-Serif)', value: 'Inter, sans-serif' },
  { name: 'Playfair Display (Elegant Serif)', value: 'Playfair Display, serif' },
  { name: 'Fira Code (Technical)', value: 'Fira Code, monospace' },
  { name: 'Cabinet Grotesk (Bold Editorial)', value: 'Cabinet Grotesk, sans-serif' },
];

export default function BrandKit({ initialConfig, onSave }: BrandKitProps) {
  const [config, setConfig] = useState<BrandKitConfig>(initialConfig || {
    primary_color: '#4F46E5',
    bg_color: '#FFFFFF',
    font_family: 'Inter, sans-serif',
    creator_handle: 'educator_unleashed'
  });

  const handlePresetSelect = (primary: string, bg: string) => {
    setConfig((prev: BrandKitConfig) => ({ ...prev, primary_color: primary, bg_color: bg }));
  };

  const handleSave = () => {
    onSave(config);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-5">
        <PaintBrushIcon className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-slate-800 text-lg">My Brand Kit & Aesthetics</h2>
      </div>

      <div className="space-y-5">
        {/* Preset Palettes */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preset Themes</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PRESET_PALETTES.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset.primary, preset.bg)}
                className={`flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                  config.primary_color === preset.primary && config.bg_color === preset.bg
                    ? 'border-indigo-600 bg-indigo-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-[11px] font-medium text-slate-600 mb-2 truncate">{preset.name}</span>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: preset.primary }} />
                  <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: preset.bg }} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Palette Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Branding Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={config.primary_color}
                onChange={(e) => setConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-10 h-10 p-0 border border-slate-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={config.primary_color}
                onChange={(e) => setConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                className="block w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Slide Canvas Background</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={config.bg_color}
                onChange={(e) => setConfig(prev => ({ ...prev, bg_color: e.target.value }))}
                className="w-10 h-10 p-0 border border-slate-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={config.bg_color}
                onChange={(e) => setConfig(prev => ({ ...prev, bg_color: e.target.value }))}
                className="block w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Font Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Typography Font Family</label>
          <select
            value={config.font_family}
            onChange={(e) => setConfig(prev => ({ ...prev, font_family: e.target.value }))}
            className="block w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {FONTS.map(font => (
              <option key={font.name} value={font.value}>{font.name}</option>
            ))}
          </select>
        </div>

        {/* Handle */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Social Handle (appears on slide footers)</label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm">@</span>
            </div>
            <input
              type="text"
              value={config.creator_handle}
              onChange={(e) => setConfig(prev => ({ ...prev, creator_handle: e.target.value.replace('@', '') }))}
              className="block w-full pl-7 text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="my_academy"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <SparklesIcon className="w-4 h-4 mr-2" />
            Apply Styles
          </button>
        </div>
      </div>
    </div>
  );
}
