import React from 'react';
import Dropzone from './components/dashboard/Dropzone';
import ActiveExtractions from './components/dashboard/ActiveExtractions';
import RecentAssets from './components/dashboard/RecentAssets';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, Sid! 👋</h1>
        <p className="mt-1 text-sm text-slate-500">Ready to repurpose some content today?</p>
      </div>

      <Dropzone />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ActiveExtractions />
        </div>
        <div className="lg:col-span-2">
          <RecentAssets />
        </div>
      </div>
    </div>
  );
}
