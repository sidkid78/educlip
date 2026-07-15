'use client';

import React, { useEffect, useState } from 'react';
import {
  FolderIcon,
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  DocumentIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  source_count: number;
  asset_count: number;
}

const AUTH = { Authorization: 'Bearer mock_admin_token' };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/v1/projects', { headers: AUTH });
      if (res.ok) setProjects(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      if (res.ok) {
        setName('');
        setDescription('');
        await load();
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await fetch(`/api/v1/projects/${id}`, { method: 'DELETE', headers: AUTH });
      setConfirmId(null);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-1">
          <FolderIcon className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Organize your content into projects — a webinar series, a course, a campaign — and upload source material into each.
        </p>

        {/* Create form */}
        <form
          onSubmit={createProject}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-8 flex flex-col sm:flex-row gap-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name…"
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            {creating ? 'Creating…' : 'New Project'}
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-slate-500 py-10 text-center">Loading projects…</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
            <FolderIcon className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-[1.2]" />
            <h3 className="font-semibold text-slate-700 text-sm">No projects yet</h3>
            <p className="text-xs text-slate-500 mt-1">Create your first project above to start organizing content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all rounded-xl p-5 flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <FolderIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  {confirmId === p.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => deleteProject(p.id)}
                        className="text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 px-2 py-1 rounded"
                      >
                        Confirm delete
                      </button>
                      <button onClick={() => setConfirmId(null)} className="text-[11px] text-slate-500 hover:text-slate-700 px-1">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(p.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                      aria-label="Delete project"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 mt-4 line-clamp-1">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed min-h-[2rem]">
                  {p.description || 'No description'}
                </p>

                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <DocumentIcon className="w-3.5 h-3.5" /> {p.source_count} sources
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <SparklesIcon className="w-3.5 h-3.5" /> {p.asset_count} assets
                  </span>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <a
                    href={`/projects/${p.id}`}
                    className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>Open project</span>
                    <ArrowRightIcon className="w-3.5 h-3.5 ml-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
