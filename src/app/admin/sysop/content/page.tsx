'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface TrainingModule {
  id: string;
  slug: string;
  title: string;
  category: string;
  track: string;
  estimated_minutes: number;
  is_active: boolean;
}

export default function ContentPage() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('training_modules')
      .select('id, slug, title, category, track, estimated_minutes, is_active')
      .order('sort_order');

    if (!error && data) {
      setModules(data);
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    const supabase = createClient();
    await supabase.from('training_modules').update({ is_active: !currentState }).eq('id', id);
    fetchModules();
  };

  const categoryColors: Record<string, string> = {
    orientation: 'bg-blue-900 text-blue-300',
    moderator: 'bg-purple-900 text-purple-300',
    field_trapper: 'bg-green-900 text-green-300',
    field_transport: 'bg-orange-900 text-orange-300',
    field_foster: 'bg-pink-900 text-pink-300',
    safety: 'bg-red-900 text-red-300',
    advanced: 'bg-amber-900 text-amber-300',
  };

  const groupedModules = modules.reduce((acc, mod) => {
    if (!acc[mod.category]) acc[mod.category] = [];
    acc[mod.category].push(mod);
    return acc;
  }, {} as Record<string, TrainingModule[]>);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
          <h1 className="text-2xl font-bold mt-2">📝 Content Management</h1>
          <p className="text-zinc-500 text-sm">Edit training module content and settings</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading modules...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedModules).map(([category, mods]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[category] || 'bg-zinc-800'}`}>
                    {category.replace('_', ' ')}
                  </span>
                  <span className="text-zinc-500 text-sm font-normal">({mods.length} modules)</span>
                </h2>
                <div className="space-y-2">
                  {mods.map(mod => (
                    <div key={mod.id} className="border border-zinc-800 rounded-lg bg-zinc-900/20 p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{mod.title}</div>
                        <div className="text-xs text-zinc-500">
                          {mod.slug} • {mod.estimated_minutes} min • Track: {mod.track}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(mod.id, mod.is_active)}
                          className={`text-xs px-2 py-1 rounded ${mod.is_active ? 'bg-green-800 hover:bg-green-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                        >
                          {mod.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <Link
                          href={`/admin/sysop/content/${mod.slug}`}
                          className="text-xs bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
          <div className="text-sm font-medium mb-2">Quick Actions</div>
          <div className="flex gap-2">
            <button className="text-xs bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded">
              + Add New Module
            </button>
            <button className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded">
              Export All Content
            </button>
            <button className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded">
              Import Content
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
