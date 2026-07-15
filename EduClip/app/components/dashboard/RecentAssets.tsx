import React from 'react';
import { DocumentTextIcon, PhotoIcon, PlayIcon } from '@heroicons/react/24/outline';

const assets = [
  {
    id: 1,
    title: '3-Step SEO Framework',
    type: 'Carousel',
    icon: PhotoIcon,
    status: 'Draft',
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-100',
  },
  {
    id: 2,
    title: 'Stop doing this one thing',
    type: 'Short Script',
    icon: PlayIcon,
    status: 'Approved',
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-100',
  },
  {
    id: 3,
    title: 'Deep Dive: Keyword Research',
    type: 'Newsletter',
    icon: DocumentTextIcon,
    status: 'Scheduled',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-100',
  }
];

export default function RecentAssets() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-base font-semibold text-slate-900">Recent Assets</h3>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {assets.map((asset) => (
          <div key={asset.id} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group">
            <div className={`w-10 h-10 rounded-lg ${asset.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <asset.icon className={`w-6 h-6 ${asset.iconColor}`} />
            </div>
            <h4 className="font-semibold text-slate-900 text-sm mb-1">{asset.title}</h4>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{asset.type}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full 
                ${asset.status === 'Draft' ? 'bg-slate-100 text-slate-600' : 
                  asset.status === 'Approved' ? 'bg-indigo-100 text-indigo-700' : 
                  'bg-emerald-100 text-emerald-700'}`}
              >
                {asset.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
