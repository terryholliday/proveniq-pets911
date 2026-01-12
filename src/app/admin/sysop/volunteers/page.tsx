'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Volunteer {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  capabilities: string[];
  primary_county: string | null;
  created_at: string;
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVolunteers(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const supabase = createClient();
    await supabase.from('volunteers').update({ status: newStatus }).eq('id', id);
    fetchVolunteers();
  };

  const updateCapabilities = async (id: string, capabilities: string[]) => {
    const supabase = createClient();
    await supabase.from('volunteers').update({ capabilities }).eq('id', id);
    fetchVolunteers();
  };

  const filteredVolunteers = volunteers.filter(v => {
    if (filter === 'all') return true;
    if (filter === 'active') return v.status === 'ACTIVE';
    if (filter === 'inactive') return v.status !== 'ACTIVE';
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2">👤 All Volunteers</h1>
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm rounded ${filter === f ? 'bg-amber-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading...</div>
        ) : (
          <div className="space-y-3">
            {filteredVolunteers.map(vol => (
              <div key={vol.id} className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{vol.display_name || 'No Name'}</div>
                    <div className="text-sm text-zinc-500">{vol.email} • {vol.phone || 'No phone'}</div>
                    <div className="text-xs text-zinc-600 mt-1">County: {vol.primary_county || 'None'}</div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {(vol.capabilities || []).map(cap => (
                        <span key={cap} className="text-xs bg-zinc-800 px-2 py-0.5 rounded">{cap}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`text-xs px-2 py-0.5 rounded ${vol.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-zinc-800 text-zinc-400'}`}>
                      {vol.status}
                    </span>
                    <div className="flex gap-2">
                      {vol.status !== 'ACTIVE' && (
                        <button
                          onClick={() => updateStatus(vol.id, 'ACTIVE')}
                          className="text-xs bg-green-800 hover:bg-green-700 px-2 py-1 rounded"
                        >
                          Activate
                        </button>
                      )}
                      {vol.status === 'ACTIVE' && (
                        <button
                          onClick={() => updateStatus(vol.id, 'INACTIVE')}
                          className="text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded"
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const caps = prompt('Enter capabilities (comma-separated):', (vol.capabilities || []).join(','));
                          if (caps !== null) {
                            updateCapabilities(vol.id, caps.split(',').map(c => c.trim()).filter(Boolean));
                          }
                        }}
                        className="text-xs bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded"
                      >
                        Edit Caps
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredVolunteers.length === 0 && (
              <div className="text-center py-10 text-zinc-500">No volunteers found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
