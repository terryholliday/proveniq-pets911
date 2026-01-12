'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface BackgroundCheck {
  id: string;
  user_id: string;
  provider: string;
  status: string;
  check_type: string;
  submitted_at: string | null;
  completed_at: string | null;
  result_summary: string | null;
  created_at: string;
  volunteer?: { display_name: string; email: string; phone: string };
}

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  not_started: { color: 'bg-zinc-800 text-zinc-400', icon: '○', label: 'Not Started' },
  pending: { color: 'bg-yellow-900 text-yellow-300', icon: '⏳', label: 'Pending' },
  in_review: { color: 'bg-blue-900 text-blue-300', icon: '🔍', label: 'In Review' },
  cleared: { color: 'bg-green-900 text-green-300', icon: '✓', label: 'Cleared' },
  flagged: { color: 'bg-orange-900 text-orange-300', icon: '⚠️', label: 'Flagged' },
  failed: { color: 'bg-red-900 text-red-300', icon: '✗', label: 'Failed' },
  expired: { color: 'bg-zinc-700 text-zinc-400', icon: '⌛', label: 'Expired' },
};

export default function BackgroundChecksPage() {
  const [checks, setChecks] = useState<BackgroundCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [selectedCheck, setSelectedCheck] = useState<BackgroundCheck | null>(null);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchChecks();
  }, [filter]);

  const getSession = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const fetchChecks = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/background-checks?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      const json = await res.json();
      if (json.success && json.data) {
        setChecks(json.data);
      } else {
        setError(json.error?.message || 'Failed to load');
      }
    } catch (e) {
      setError('Network error');
      console.error(e);
    }

    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    setError(null);

    try {
      const session = await getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/background-checks', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status, notes: notes || undefined }),
      });

      const json = await res.json();
      if (json.success) {
        await fetchChecks();
        setSelectedCheck(null);
        setNotes('');
      } else {
        setError(json.error?.message || 'Failed to update');
      }
    } catch (e) {
      setError('Network error');
      console.error(e);
    }

    setSaving(false);
  };

  const stats = {
    total: checks.length,
    pending: checks.filter(c => ['pending', 'in_review'].includes(c.status)).length,
    flagged: checks.filter(c => c.status === 'flagged').length,
    cleared: checks.filter(c => c.status === 'cleared').length,
    failed: checks.filter(c => c.status === 'failed').length,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2">🔍 Background Checks</h1>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="text-center px-3 py-2 bg-zinc-900 rounded-lg">
              <div className="text-lg font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-xs text-zinc-500">Pending</div>
            </div>
            <div className="text-center px-3 py-2 bg-zinc-900 rounded-lg">
              <div className="text-lg font-bold text-orange-400">{stats.flagged}</div>
              <div className="text-xs text-zinc-500">Flagged</div>
            </div>
            <div className="text-center px-3 py-2 bg-zinc-900 rounded-lg">
              <div className="text-lg font-bold text-green-400">{stats.cleared}</div>
              <div className="text-xs text-zinc-500">Cleared</div>
            </div>
            <button onClick={fetchChecks} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg">
              🔄
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          {(['pending', 'completed', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                filter === f ? 'bg-amber-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              {f === 'pending' ? '⏳ Pending Review' : f === 'completed' ? '✓ Completed' : '📋 All'}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading...</div>
        ) : checks.length === 0 ? (
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-zinc-400">No background checks to review</div>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-900/80">
                <tr className="text-left text-xs text-zinc-400 uppercase">
                  <th className="px-4 py-3">Volunteer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {checks.map(check => {
                  const statusCfg = STATUS_CONFIG[check.status] || STATUS_CONFIG.not_started;
                  return (
                    <tr key={check.id} className="hover:bg-zinc-900/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{check.volunteer?.display_name || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500">{check.volunteer?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{check.check_type}</td>
                      <td className="px-4 py-3 text-sm text-zinc-400">{check.provider}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusCfg.color}`}>
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {check.submitted_at ? new Date(check.submitted_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setSelectedCheck(check); setNotes(check.result_summary || ''); }}
                          className="text-xs bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded-lg"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-xs text-zinc-500 text-center">
          Showing {checks.length} background checks
        </div>
      </div>

      {/* Review Modal */}
      {selectedCheck && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold">🔍 Review Background Check</h2>
              <button onClick={() => setSelectedCheck(null)} className="text-zinc-400 hover:text-white text-xl">×</button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="font-medium">{selectedCheck.volunteer?.display_name}</div>
                <div className="text-sm text-zinc-400">{selectedCheck.volunteer?.email}</div>
                <div className="text-xs text-zinc-500">{selectedCheck.volunteer?.phone}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Type:</span>
                  <span className="ml-2">{selectedCheck.check_type}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Provider:</span>
                  <span className="ml-2">{selectedCheck.provider}</span>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-sm">Current Status:</span>
                <span className={`ml-2 text-xs px-2 py-1 rounded-full ${STATUS_CONFIG[selectedCheck.status]?.color}`}>
                  {STATUS_CONFIG[selectedCheck.status]?.label || selectedCheck.status}
                </span>
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">Notes / Result Summary</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm h-20"
                  placeholder="Add notes about this check..."
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">Update Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateStatus(selectedCheck.id, 'cleared')}
                    disabled={saving}
                    className="py-2 px-3 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    ✓ Clear / Approve
                  </button>
                  <button
                    onClick={() => updateStatus(selectedCheck.id, 'failed')}
                    disabled={saving}
                    className="py-2 px-3 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    ✗ Fail / Deny
                  </button>
                  <button
                    onClick={() => updateStatus(selectedCheck.id, 'flagged')}
                    disabled={saving}
                    className="py-2 px-3 bg-orange-700 hover:bg-orange-600 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    ⚠️ Flag for Review
                  </button>
                  <button
                    onClick={() => updateStatus(selectedCheck.id, 'in_review')}
                    disabled={saving}
                    className="py-2 px-3 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    🔍 Mark In Review
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-800/30">
              <button
                onClick={() => setSelectedCheck(null)}
                className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
