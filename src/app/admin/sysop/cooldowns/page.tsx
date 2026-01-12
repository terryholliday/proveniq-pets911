'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Cooldown {
  id: string;
  user_id: string;
  trigger_reason: string;
  cooldown_type: string;
  restricted_actions: string[];
  started_at: string;
  ends_at: string;
  acknowledged_at: string | null;
  volunteer?: { display_name: string; email: string; phone: string };
}

const TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  short_break: { color: 'bg-yellow-900 text-yellow-300', icon: '☕', label: 'Short Break' },
  tier_restriction: { color: 'bg-orange-900 text-orange-300', icon: '⚠️', label: 'Tier Restriction' },
  full_lockout: { color: 'bg-red-900 text-red-300', icon: '🔒', label: 'Full Lockout' },
  mandatory_debrief: { color: 'bg-purple-900 text-purple-300', icon: '💬', label: 'Mandatory Debrief' },
};

export default function CooldownsPage() {
  const [cooldowns, setCooldowns] = useState<Cooldown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCooldown, setSelectedCooldown] = useState<Cooldown | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCooldowns();
  }, []);

  const getSession = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const fetchCooldowns = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/cooldowns', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      const json = await res.json();
      if (json.success && json.data) {
        setCooldowns(json.data);
      } else {
        setError(json.error?.message || 'Failed to load');
      }
    } catch (e) {
      setError('Network error');
    }

    setLoading(false);
  };

  const overrideCooldown = async () => {
    if (!selectedCooldown || !overrideReason.trim()) return;
    
    setSaving(true);
    try {
      const session = await getSession();
      if (!session?.access_token) return;

      const res = await fetch('/api/admin/cooldowns', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedCooldown.id, override_reason: overrideReason }),
      });

      const json = await res.json();
      if (json.success) {
        await fetchCooldowns();
        setSelectedCooldown(null);
        setOverrideReason('');
      } else {
        setError(json.error?.message || 'Failed to override');
      }
    } catch (e) {
      setError('Network error');
    }
    setSaving(false);
  };

  const getTimeRemaining = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2">⏸️ Cooldown Management</h1>
            <p className="text-zinc-500 text-sm">Active cooldowns for volunteers</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center px-4 py-2 bg-zinc-900 rounded-lg">
              <div className="text-xl font-bold text-amber-400">{cooldowns.length}</div>
              <div className="text-xs text-zinc-500">Active</div>
            </div>
            <button onClick={fetchCooldowns} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg">🔄</button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">⚠️ {error}</div>
        )}

        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading...</div>
        ) : cooldowns.length === 0 ? (
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-zinc-400">No active cooldowns</div>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-900/80">
                <tr className="text-left text-xs text-zinc-400 uppercase">
                  <th className="px-4 py-3">Volunteer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Time Left</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {cooldowns.map(cd => {
                  const typeCfg = TYPE_CONFIG[cd.cooldown_type] || { color: 'bg-zinc-800', icon: '⏸', label: cd.cooldown_type };
                  return (
                    <tr key={cd.id} className="hover:bg-zinc-900/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{cd.volunteer?.display_name || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500">{cd.volunteer?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${typeCfg.color}`}>
                          {typeCfg.icon} {typeCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400 max-w-xs truncate">{cd.trigger_reason}</td>
                      <td className="px-4 py-3">
                        <div className="text-lg font-mono text-amber-400">{getTimeRemaining(cd.ends_at)}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setSelectedCooldown(cd); setOverrideReason(''); }}
                          className="text-xs bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded-lg"
                        >
                          Override
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Override Modal */}
      {selectedCooldown && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold">⚠️ Override Cooldown</h2>
              <button onClick={() => setSelectedCooldown(null)} className="text-zinc-400 hover:text-white text-xl">×</button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="font-medium">{selectedCooldown.volunteer?.display_name}</div>
                <div className="text-sm text-zinc-400">{selectedCooldown.trigger_reason}</div>
                <div className="text-xs text-amber-400 mt-1">{getTimeRemaining(selectedCooldown.ends_at)} remaining</div>
              </div>

              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 text-sm text-red-300">
                ⚠️ Overriding a cooldown ends it immediately. This action is logged.
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">Override Reason (required)</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm h-20"
                  placeholder="Explain why this cooldown is being overridden..."
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-zinc-800">
              <button onClick={() => setSelectedCooldown(null)} className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm">
                Cancel
              </button>
              <button
                onClick={overrideCooldown}
                disabled={saving || !overrideReason.trim()}
                className="flex-1 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Override Cooldown'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
