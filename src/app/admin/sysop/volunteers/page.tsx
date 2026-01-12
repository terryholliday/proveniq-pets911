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

const ALL_CAPABILITIES = [
  { id: 'SYSOP', label: 'System Operator', color: 'bg-red-900 text-red-200', icon: '⚡' },
  { id: 'MODERATOR', label: 'Moderator', color: 'bg-purple-900 text-purple-200', icon: '🛡️' },
  { id: 'DISPATCHER', label: 'Dispatcher', color: 'bg-blue-900 text-blue-200', icon: '📡' },
  { id: 'TRANSPORTER', label: 'Transporter', color: 'bg-green-900 text-green-200', icon: '🚗' },
  { id: 'FOSTER', label: 'Foster', color: 'bg-yellow-900 text-yellow-200', icon: '🏠' },
  { id: 'TRAPPER', label: 'Trapper', color: 'bg-orange-900 text-orange-200', icon: '🪤' },
  { id: 'SEARCH', label: 'Search Team', color: 'bg-cyan-900 text-cyan-200', icon: '🔍' },
];

const STATUS_OPTIONS = [
  { id: 'ACTIVE', label: 'Active', color: 'bg-green-700', icon: '✓' },
  { id: 'INACTIVE', label: 'Inactive', color: 'bg-zinc-700', icon: '○' },
  { id: 'SUSPENDED', label: 'Suspended', color: 'bg-yellow-700', icon: '⏸' },
  { id: 'BANNED', label: 'Banned', color: 'bg-red-700', icon: '⛔' },
  { id: 'ARCHIVED', label: 'Archived', color: 'bg-zinc-800', icon: '📁' },
];

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [capFilter, setCapFilter] = useState<string | null>(null);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{type: string; volunteer: Volunteer} | null>(null);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const getSession = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const fetchVolunteers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const session = await getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/volunteers?filter=all', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const json = await res.json();
      
      if (json.success && json.data) {
        setVolunteers(json.data);
        setError(null);
      } else {
        setError(json.error?.message || 'Failed to load volunteers');
      }
    } catch (e) {
      setError('Network error loading volunteers');
      console.error(e);
    }
    
    setLoading(false);
  };

  const updateVolunteer = async (id: string, updates: Partial<Volunteer>) => {
    setSaving(true);
    setError(null);
    
    try {
      const session = await getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        setSaving(false);
        return false;
      }

      const res = await fetch('/api/admin/volunteers', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });
      
      const json = await res.json();
      
      if (json.success) {
        await fetchVolunteers();
        setEditingVolunteer(null);
        setSaving(false);
        return true;
      } else {
        setError(json.error?.message || 'Failed to update');
        setSaving(false);
        return false;
      }
    } catch (e) {
      setError('Network error updating volunteer');
      console.error(e);
      setSaving(false);
      return false;
    }
  };

  const deleteVolunteer = async (id: string) => {
    setSaving(true);
    setError(null);
    
    try {
      const session = await getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/volunteers', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      const json = await res.json();
      
      if (json.success) {
        await fetchVolunteers();
        setConfirmAction(null);
      } else {
        setError(json.error?.message || 'Failed to delete');
      }
    } catch (e) {
      setError('Network error deleting volunteer');
      console.error(e);
    }
    
    setSaving(false);
  };

  const handleStatusChange = async (vol: Volunteer, newStatus: string) => {
    if (newStatus === 'BANNED' || newStatus === 'ARCHIVED') {
      setConfirmAction({ type: newStatus, volunteer: vol });
    } else {
      await updateVolunteer(vol.id, { status: newStatus });
    }
  };

  const quickToggleStatus = async (vol: Volunteer) => {
    const newStatus = vol.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await updateVolunteer(vol.id, { status: newStatus });
  };

  const quickToggleCap = async (vol: Volunteer, cap: string) => {
    const caps = vol.capabilities || [];
    const newCaps = caps.includes(cap) 
      ? caps.filter(c => c !== cap)
      : [...caps, cap];
    await updateVolunteer(vol.id, { capabilities: newCaps });
  };

  const filteredVolunteers = volunteers.filter(v => {
    if (filter !== 'all' && v.status !== filter) return false;
    if (capFilter && !(v.capabilities || []).includes(capFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (v.display_name || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q) ||
        (v.phone || '').includes(q) ||
        (v.primary_county || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: volunteers.length,
    active: volunteers.filter(v => v.status === 'ACTIVE').length,
    inactive: volunteers.filter(v => v.status === 'INACTIVE').length,
    suspended: volunteers.filter(v => v.status === 'SUSPENDED').length,
    banned: volunteers.filter(v => v.status === 'BANNED').length,
  };

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find(s => s.id === status) || STATUS_OPTIONS[1];
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${opt.color}`}>
        {opt.icon} {opt.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2">👤 Volunteer Management</h1>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center px-4 py-2 bg-zinc-900 rounded-lg">
              <div className="text-xl font-bold text-blue-400">{stats.total}</div>
              <div className="text-xs text-zinc-500">Total</div>
            </div>
            <div className="text-center px-4 py-2 bg-zinc-900 rounded-lg">
              <div className="text-xl font-bold text-green-400">{stats.active}</div>
              <div className="text-xs text-zinc-500">Active</div>
            </div>
            <div className="text-center px-4 py-2 bg-zinc-900 rounded-lg">
              <div className="text-xl font-bold text-zinc-400">{stats.inactive}</div>
              <div className="text-xs text-zinc-500">Inactive</div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="🔍 Search by name, email, phone, county..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 text-sm rounded-lg transition-all ${
                  filter === f 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <select
            value={capFilter || ''}
            onChange={(e) => setCapFilter(e.target.value || null)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">All Capabilities</option>
            {ALL_CAPABILITIES.map(cap => (
              <option key={cap.id} value={cap.id}>{cap.icon} {cap.label}</option>
            ))}
          </select>
        </div>

        {/* Volunteers Table */}
        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading volunteers...</div>
        ) : (
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-900/80">
                <tr className="text-left text-xs text-zinc-400 uppercase">
                  <th className="px-4 py-3">Volunteer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">County</th>
                  <th className="px-4 py-3">Capabilities</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredVolunteers.map(vol => (
                  <tr key={vol.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{vol.display_name || 'Unnamed'}</div>
                      <div className="text-xs text-zinc-500">
                        Joined {new Date(vol.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{vol.email || '—'}</div>
                      <div className="text-xs text-zinc-500">{vol.phone || 'No phone'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{vol.primary_county || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(vol.capabilities || []).length === 0 && (
                          <span className="text-xs text-zinc-600">None</span>
                        )}
                        {(vol.capabilities || []).map(cap => {
                          const capInfo = ALL_CAPABILITIES.find(c => c.id === cap);
                          return (
                            <span 
                              key={cap} 
                              className={`text-xs px-2 py-0.5 rounded cursor-pointer hover:opacity-80 ${capInfo?.color || 'bg-zinc-800'}`}
                              onClick={() => quickToggleCap(vol, cap)}
                              title={`Click to remove ${capInfo?.label || cap}`}
                            >
                              {capInfo?.icon} {cap}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => quickToggleStatus(vol)}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                          vol.status === 'ACTIVE' 
                            ? 'bg-green-900/50 text-green-300 hover:bg-green-800' 
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {vol.status === 'ACTIVE' ? '● Active' : '○ Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingVolunteer(vol)}
                        className="text-xs bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredVolunteers.length === 0 && (
              <div className="text-center py-10 text-zinc-500">No volunteers match your filters</div>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="text-xs text-zinc-500 text-center">
          Showing {filteredVolunteers.length} of {volunteers.length} volunteers
        </div>
      </div>

      {/* Edit Modal */}
      {editingVolunteer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold">✏️ Edit Volunteer</h2>
              <button 
                onClick={() => setEditingVolunteer(null)}
                className="text-zinc-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Volunteer Info */}
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="font-medium text-lg">{editingVolunteer.display_name || 'Unnamed'}</div>
                <div className="text-sm text-zinc-400">{editingVolunteer.email}</div>
                <div className="text-xs text-zinc-500">{editingVolunteer.phone || 'No phone'}</div>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="text-sm text-zinc-400 block mb-2">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingVolunteer({...editingVolunteer, status: 'ACTIVE'})}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      editingVolunteer.status === 'ACTIVE'
                        ? 'bg-green-700 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    ✓ Active
                  </button>
                  <button
                    onClick={() => setEditingVolunteer({...editingVolunteer, status: 'INACTIVE'})}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      editingVolunteer.status !== 'ACTIVE'
                        ? 'bg-red-700 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    ✗ Inactive
                  </button>
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <label className="text-sm text-zinc-400 block mb-2">Capabilities (click to toggle)</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_CAPABILITIES.map(cap => {
                    const hasCap = (editingVolunteer.capabilities || []).includes(cap.id);
                    return (
                      <button
                        key={cap.id}
                        onClick={() => {
                          const caps = editingVolunteer.capabilities || [];
                          const newCaps = hasCap 
                            ? caps.filter(c => c !== cap.id)
                            : [...caps, cap.id];
                          setEditingVolunteer({...editingVolunteer, capabilities: newCaps});
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          hasCap 
                            ? cap.color + ' ring-2 ring-white/20'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        <span>{cap.icon}</span>
                        <span>{cap.label}</span>
                        {hasCap && <span className="ml-auto">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* County */}
              <div>
                <label className="text-sm text-zinc-400 block mb-2">Primary County</label>
                <input
                  type="text"
                  value={editingVolunteer.primary_county || ''}
                  onChange={(e) => setEditingVolunteer({...editingVolunteer, primary_county: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
                  placeholder="e.g., Greenbrier"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 border-t border-zinc-800 bg-zinc-800/30">
              <button
                onClick={() => setEditingVolunteer(null)}
                className="flex-1 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateVolunteer(editingVolunteer.id, {
                  status: editingVolunteer.status,
                  capabilities: editingVolunteer.capabilities,
                  primary_county: editingVolunteer.primary_county,
                })}
                disabled={saving}
                className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
