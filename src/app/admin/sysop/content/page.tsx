'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { X, Download, Upload, Plus, Loader2 } from 'lucide-react';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModule, setNewModule] = useState({ title: '', slug: '', category: 'orientation', track: 'core', estimated_minutes: 15 });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddModule = async () => {
    if (!newModule.title || !newModule.slug) {
      setStatusMessage({ type: 'error', text: 'Title and slug are required' });
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('training_modules').insert({
        title: newModule.title,
        slug: newModule.slug.toLowerCase().replace(/\s+/g, '-'),
        category: newModule.category,
        track: newModule.track,
        estimated_minutes: newModule.estimated_minutes,
        is_active: false,
        sort_order: modules.length + 1,
        content: { sections: [] },
      });
      if (error) throw error;
      setStatusMessage({ type: 'success', text: 'Module created successfully!' });
      setShowAddModal(false);
      setNewModule({ title: '', slug: '', category: 'orientation', track: 'core', estimated_minutes: 15 });
      fetchModules();
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Failed to create module: ${err instanceof Error ? err.message : 'Unknown error'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      modules: modules,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-modules-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'success', text: `Exported ${modules.length} modules` });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.modules || !Array.isArray(data.modules)) {
        throw new Error('Invalid file format - expected modules array');
      }
      
      const supabase = createClient();
      let imported = 0;
      
      for (const mod of data.modules) {
        const { error } = await supabase.from('training_modules').upsert({
          slug: mod.slug,
          title: mod.title,
          category: mod.category,
          track: mod.track,
          estimated_minutes: mod.estimated_minutes,
          is_active: mod.is_active ?? false,
          sort_order: mod.sort_order ?? imported + 1,
        }, { onConflict: 'slug' });
        
        if (!error) imported++;
      }
      
      setStatusMessage({ type: 'success', text: `Imported ${imported} of ${data.modules.length} modules` });
      fetchModules();
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}` });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-3 rounded-lg text-sm flex items-center justify-between ${statusMessage.type === 'success' ? 'bg-green-900/30 text-green-300 border border-green-800' : 'bg-red-900/30 text-red-300 border border-red-800'}`}>
            {statusMessage.text}
            <button onClick={() => setStatusMessage(null)} className="hover:opacity-70"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
          <div className="text-sm font-medium mb-2">Quick Actions</div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAddModal(true)}
              className="text-xs bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add New Module
            </button>
            <button 
              onClick={handleExport}
              disabled={modules.length === 0}
              className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded flex items-center gap-1 disabled:opacity-50"
            >
              <Download className="w-3 h-3" /> Export All Content
            </button>
            <label className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer">
              {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Import Content
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                className="hidden" 
                disabled={importing}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Add New Module Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Training Module</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Module Title *</label>
                <input 
                  type="text" 
                  value={newModule.title}
                  onChange={(e) => setNewModule({ ...newModule, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                  placeholder="e.g., Animal Handling Basics"
                />
              </div>
              
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Slug *</label>
                <input 
                  type="text" 
                  value={newModule.slug}
                  onChange={(e) => setNewModule({ ...newModule, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-mono"
                  placeholder="e.g., animal-handling-basics"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Category</label>
                  <select 
                    value={newModule.category}
                    onChange={(e) => setNewModule({ ...newModule, category: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                  >
                    <option value="orientation">Orientation</option>
                    <option value="moderator">Moderator</option>
                    <option value="field_trapper">Field Trapper</option>
                    <option value="field_transport">Field Transport</option>
                    <option value="field_foster">Field Foster</option>
                    <option value="safety">Safety</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Track</label>
                  <select 
                    value={newModule.track}
                    onChange={(e) => setNewModule({ ...newModule, track: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                  >
                    <option value="core">Core</option>
                    <option value="field">Field</option>
                    <option value="dispatch">Dispatch</option>
                    <option value="leadership">Leadership</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Estimated Minutes</label>
                <input 
                  type="number" 
                  value={newModule.estimated_minutes}
                  onChange={(e) => setNewModule({ ...newModule, estimated_minutes: parseInt(e.target.value) || 15 })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                  min="5"
                  max="120"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleAddModule}
                  disabled={saving}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-black font-medium py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? 'Creating...' : 'Create Module'}
                </button>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
