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
  volunteer?: { display_name: string; email: string };
}

export default function BackgroundChecksPage() {
  const [checks, setChecks] = useState<BackgroundCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecks();
  }, []);

  const fetchChecks = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('volunteer_background_checks')
      .select('*, volunteer:volunteers(display_name, email)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setChecks(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    await supabase.from('volunteer_background_checks').update({ 
      status,
      completed_at: ['cleared', 'failed'].includes(status) ? new Date().toISOString() : null
    }).eq('id', id);
    fetchChecks();
  };

  const statusColors: Record<string, string> = {
    not_started: 'bg-zinc-800 text-zinc-400',
    pending: 'bg-yellow-900 text-yellow-300',
    in_review: 'bg-blue-900 text-blue-300',
    cleared: 'bg-green-900 text-green-300',
    flagged: 'bg-orange-900 text-orange-300',
    failed: 'bg-red-900 text-red-300',
    expired: 'bg-zinc-700 text-zinc-400',
  };

  const pendingChecks = checks.filter(c => ['pending', 'in_review', 'flagged'].includes(c.status));
  const completedChecks = checks.filter(c => ['cleared', 'failed', 'expired'].includes(c.status));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
          <h1 className="text-2xl font-bold mt-2">🔍 Background Checks</h1>
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading...</div>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-semibold text-zinc-300 mb-3">Pending Review ({pendingChecks.length})</h2>
              {pendingChecks.length === 0 ? (
                <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4 text-center text-zinc-500">
                  No pending checks
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingChecks.map(check => (
                    <div key={check.id} className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{check.volunteer?.display_name || check.volunteer?.email}</div>
                          <div className="text-sm text-zinc-500">{check.check_type} • {check.provider}</div>
                          {check.result_summary && (
                            <div className="text-xs text-zinc-600 mt-1">{check.result_summary}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${statusColors[check.status]}`}>
                            {check.status}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateStatus(check.id, 'cleared')}
                              className="text-xs bg-green-800 hover:bg-green-700 px-2 py-1 rounded"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(check.id, 'failed')}
                              className="text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-300 mb-3">Completed ({completedChecks.length})</h2>
              <div className="space-y-2">
                {completedChecks.slice(0, 10).map(check => (
                  <div key={check.id} className="border border-zinc-800 rounded-lg bg-zinc-900/20 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm">{check.volunteer?.display_name || check.volunteer?.email}</span>
                      <span className="text-xs text-zinc-600 ml-2">{check.check_type}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[check.status]}`}>
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
