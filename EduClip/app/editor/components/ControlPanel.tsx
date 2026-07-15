import React from 'react';
import { SwatchIcon, ShareIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export default function ControlPanel() {
  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 w-80 shrink-0">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex space-x-1 p-1 bg-slate-200/50 rounded-lg">
          <button className="flex-1 py-1.5 text-xs font-semibold rounded-md bg-white text-slate-900 shadow-sm border border-slate-200 flex items-center justify-center gap-1">
            <SwatchIcon className="w-4 h-4" /> Style
          </button>
          <button className="flex-1 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors">
            <ShareIcon className="w-4 h-4" /> Distribute
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Theme</h4>
          <div className="grid grid-cols-2 gap-3">
            <button className="h-16 rounded-lg border-2 border-indigo-500 bg-white shadow-sm flex items-center justify-center relative overflow-hidden group">
              <span className="font-semibold text-slate-800 text-sm z-10 group-hover:scale-105 transition-transform">Light Minimal</span>
              <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-500 rounded-bl-full opacity-10"></div>
            </button>
            <button className="h-16 rounded-lg border border-slate-200 bg-slate-900 shadow-sm flex items-center justify-center hover:border-slate-400 transition-colors">
              <span className="font-semibold text-white text-sm">Dark Sleek</span>
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            Brand Colors <AdjustmentsHorizontalIcon className="w-4 h-4" />
          </h4>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 ring-2 ring-offset-2 ring-indigo-600 cursor-pointer shadow-md"></div>
            <div className="w-8 h-8 rounded-full bg-rose-500 cursor-pointer hover:scale-110 transition-transform shadow-sm"></div>
            <div className="w-8 h-8 rounded-full bg-emerald-500 cursor-pointer hover:scale-110 transition-transform shadow-sm"></div>
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors">
              +
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Font Pairings</h4>
          <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm cursor-pointer">
            <option>Inter & System UI</option>
            <option>Playfair & Lora</option>
            <option>Outfit & Roboto</option>
          </select>
        </div>
      </div>

      <div className="p-6 border-t border-slate-200 bg-slate-50/50">
        <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/40 hover:-translate-y-0.5">
          Approve & Schedule
        </button>
      </div>
    </div>
  );
}
