import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const extractions = [
  {
    id: 1,
    project: 'Webinar #4: SEO Mastery',
    status: 'Extracting...',
    progress: 80,
    color: 'bg-indigo-600'
  },
  {
    id: 2,
    project: 'Ebook: 10 Growth Hacks',
    status: 'Generating Assets...',
    progress: 45,
    color: 'bg-fuchsia-600'
  }
];

export default function ActiveExtractions() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <ArrowPathIcon className="w-5 h-5 text-indigo-500 animate-spin-slow" />
          Active Extractions
        </h3>
        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
          {extractions.length} In Progress
        </span>
      </div>
      <ul className="divide-y divide-slate-100">
        {extractions.map((job) => (
          <li key={job.id} className="p-6">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-sm text-slate-900">{job.project}</span>
              <span className="text-xs font-semibold text-slate-500">{job.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full ${job.color} transition-all duration-1000 ease-out`} 
                style={{ width: `${job.progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 font-medium">{job.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
