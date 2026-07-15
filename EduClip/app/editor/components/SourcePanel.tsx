import React from 'react';
import { PlayCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

const concepts = [
  { id: 1, title: 'The 3 Pillars of SEO', time: '12:30' },
  { id: 2, title: 'Why backlinks are overrated', time: '18:45' },
  { id: 3, title: 'Keyword intent framework', time: '24:10' }
];

export default function SourcePanel() {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80 shrink-0">
      <div className="p-4 border-b border-slate-200">
        <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden group">
          <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=640&auto=format&fit=crop" alt="Webinar" className="w-full h-full object-cover opacity-60" />
          <PlayCircleIcon className="w-12 h-12 text-white absolute group-hover:scale-110 transition-transform cursor-pointer" />
        </div>
        <h3 className="font-semibold text-sm mt-3 text-slate-900">Webinar #4: SEO Mastery</h3>
      </div>
      
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 text-indigo-500" />
        <h4 className="font-semibold text-sm text-slate-900">AI Extracted Concepts</h4>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {concepts.map((concept, idx) => (
          <div 
            key={concept.id} 
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${idx === 0 ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-100/50 px-2 py-0.5 rounded">Concept {idx + 1}</span>
              <span className="text-xs font-medium text-slate-500">{concept.time}</span>
            </div>
            <h5 className="text-sm font-semibold text-slate-900 leading-snug">{concept.title}</h5>
            {idx === 0 && (
              <ul className="mt-2 space-y-1">
                <li className="text-xs text-slate-600 flex gap-1"><span className="text-indigo-400">•</span> Content relevance</li>
                <li className="text-xs text-slate-600 flex gap-1"><span className="text-indigo-400">•</span> Technical foundation</li>
                <li className="text-xs text-slate-600 flex gap-1"><span className="text-indigo-400">•</span> Authority building</li>
              </ul>
            )}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button className="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          Regenerate Insights
        </button>
      </div>
    </div>
  );
}
