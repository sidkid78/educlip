'use client';

import React, { useEffect, useState } from 'react';
import {
  Cog6ToothIcon,
  CreditCardIcon,
  CircleStackIcon,
  CheckCircleIcon,
  FolderIcon,
  DocumentIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface SettingsData {
  organization: {
    name: string;
    slug: string;
    plan_tier: string;
    subscription_status: string;
    ai_credits_remaining: number;
    brand_configured: boolean;
  };
  usage: { projects: number; sources: number; assets: number; published: number };
  platforms: { key: string; name: string; connected: boolean }[];
}

const AUTH = { Authorization: 'Bearer mock_admin_token' };

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-slate-100 text-slate-700',
  pro: 'bg-indigo-100 text-indigo-700',
  agency: 'bg-violet-100 text-violet-700',
};

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const load = async () => {
    const res = await fetch('/api/v1/settings', { headers: AUTH });
    if (res.ok) {
      const d = await res.json();
      setData(d);
      setName(d.organization.name);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveName = async () => {
    if (!name.trim() || name === data?.organization.name) return;
    setSavingName(true);
    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setData(await res.json());
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 3000);
      }
    } finally {
      setSavingName(false);
    }
  };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/v1/billing/customer-portal', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_url: window.location.href }),
      });
      if (res.ok) {
        const { portal_url } = await res.json();
        if (portal_url) window.open(portal_url, '_blank', 'noopener');
      }
    } finally {
      setPortalLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-sm text-slate-500 py-10">Loading settings…</p>
        </main>
      </div>
    );
  }

  const org = data.organization;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Cog6ToothIcon className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        </div>

        {/* Account */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Account</h2>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Workspace name</label>
          <div className="flex gap-2 max-w-md">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              onClick={saveName}
              disabled={savingName || !name.trim() || name === org.name}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-medium text-sm rounded-lg transition-colors"
            >
              {savingName ? 'Saving…' : 'Save'}
            </button>
          </div>
          {nameSaved && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
              <CheckCircleIcon className="w-4 h-4" /> Saved
            </p>
          )}
          <p className="text-xs text-slate-400 mt-2">Workspace slug: {org.slug}</p>
        </section>

        {/* Plan & billing */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-indigo-600" /> Plan & Billing
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-xs text-slate-500 mb-1">Current plan</div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold capitalize ${PLAN_BADGE[org.plan_tier] || PLAN_BADGE.free}`}>
                {org.plan_tier}
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Subscription</div>
              <span className="text-sm font-medium text-slate-700 capitalize">{org.subscription_status}</span>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">AI credits</div>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                <CircleStackIcon className="w-4 h-4 text-indigo-600" /> {org.ai_credits_remaining}
              </span>
            </div>
            <button
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:border-indigo-400 hover:text-indigo-600 text-slate-700 font-medium text-sm rounded-lg transition-colors"
            >
              {portalLoading ? 'Opening…' : 'Manage billing'}
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Usage */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Usage</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Projects', value: data.usage.projects, Icon: FolderIcon },
              { label: 'Sources', value: data.usage.sources, Icon: DocumentIcon },
              { label: 'Assets', value: data.usage.assets, Icon: SparklesIcon },
              { label: 'Published', value: data.usage.published, Icon: PaperAirplaneIcon },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-200 p-4">
                <s.Icon className="w-5 h-5 text-indigo-500 mb-2" />
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Connected platforms */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Connected platforms</h2>
          <p className="text-xs text-slate-500 mb-4">Platforms you&apos;ve published to appear as connected.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.platforms.map((p) => (
              <div key={p.key} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{p.name}</span>
                {p.connected ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircleIcon className="w-4 h-4" /> Connected
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400">Not connected</span>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
