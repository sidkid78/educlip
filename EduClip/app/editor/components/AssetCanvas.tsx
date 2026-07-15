import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function AssetCanvas() {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
        {/* Carousel Slide Preview */}
        <div className="w-full max-w-sm aspect-[4/5] bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col relative overflow-hidden transition-transform duration-300 hover:shadow-xl">
          {/* Abstract Top Shape */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-bl-full opacity-10"></div>
          
          <div className="p-8 flex-1 flex flex-col justify-center">
            <div className="mb-4">
              <span className="text-indigo-600 font-bold tracking-widest text-xs uppercase">Step 1 of 3</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
              Content Relevance is <span className="text-indigo-600">King</span>.
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              Don't guess what people want. Use search intent data to drive your content strategy.
            </p>
          </div>
          
          <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-200"></div>
              <span className="font-semibold text-sm text-slate-800">@SidAcademy</span>
            </div>
            <div className="w-6 h-6 border-2 border-indigo-600 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-indigo-600"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pagination Controls */}
      <div className="h-16 bg-white border-t border-slate-200 flex items-center justify-between px-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
        <button className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
