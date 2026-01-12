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
  volunteer?: { display_name: string; email: string };
}

export default function CooldownsPage() {
  const [cooldowns, setCooldowns] = useState<Cooldown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCooldowns();
  }, []);

  const fetchCooldowns = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('volunteer_cooldown_events')
      .select('*, volunteer:volunteers(display_name, email)')
      .gt('ends_at', new Date().toISOString())
      .order('ends_at', { ascending: true });

    if (!error && data) {
      setCooldowns(data);
    }
    setLoading(false);
  };

  const overrideCooldown = async (id: string) => {
    const reason = prompt('Override reason:');
    if (!reason) return;
    
    const supabase = createClient();
    await supabase
      .from('volunteer_cooldown_events')
      .update({ 
        ends_at: new Date().toISOString(),
        override_reason: reason 
      })
      .eq('id', id);
    fetchCooldowns();
  };

  const getTimeRemaining = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const typeColors: Record<string, string> = {
    short_break: 'bg-yellow-900 text-yellow-300',
    tier_restriction: 'bg-orange-900 text-orange-300',
    full_lockout: 'bg-red-900 text-red-300',
    mandatory_debrief: 'bg-purple-900 text-purple-300',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
          <h1 className="text-2xl font-bold mt-2">⏸️ Cooldown Management</h1>
          <p className="text-zinc-500 text-sm">Active cooldowns for volunteers</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading...</div>
        ) : cooldowns.length === 0 ? (
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-zinc-400">No active cooldowns</div>
          </div>
        ) : (
          <div className="space-y-3">
            {cooldowns.map(cd => (
              <div key={cd.id} className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{cd.volunteer?.display_name || cd.volunteer?.email || 'Unknown'}</div>
                    <div className="text-sm text-zinc-500 mt-1">{cd.trigger_reason}</div>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${typeColors[cd.cooldown_type] || 'bg-zinc-800'}`}>
                        {cd.cooldown_type.replace('_', ' ')}
                      </span>
                      {cd.acknowledged_at && (
                        <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">Acknowledged</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-mono text-amber-400">{getTimeRemaining(cd.ends_at)}</div>
                    <div className="text-xs text-zinc-600">remaining</div>
                    <button
                      onClick={() => overrideCooldown(cd.id)}
                      className="mt-2 text-xs bg-red-800 hover:bg-red-700 px-3 py-1 rounded"
                    >
                      Override
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
