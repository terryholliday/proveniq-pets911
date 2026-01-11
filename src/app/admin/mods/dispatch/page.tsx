'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, RefreshCcw, UserPlus, Users, ShieldAlert } from 'lucide-react';

type DispatchRow = {
  id: string;
  request_type: 'TRANSPORT' | 'FOSTER' | 'EMERGENCY_ASSIST';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  species: string;
  animal_size: string;
  needs_crate: boolean;
  pickup_address: string;
  county: string;
  requester_name: string;
  requester_phone: string;
  volunteer_id: string | null;
  volunteer_name: string | null;
  volunteer_phone: string | null;
  status: string;
  requested_at: string;
  expires_at: string;
};

type Candidate = {
  volunteer_id: string;
  volunteer_name: string;
  volunteer_phone: string;
  is_available_now: boolean;
  last_active_at: string | null;
};

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export default function ModeratorDispatchQueuePage() {
  const { user, loading } = useAuth();
  const [queue, setQueue] = useState<DispatchRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => queue.find((d) => d.id === selectedId) || null, [queue, selectedId]);

  const loadQueue = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('You must be signed in.');
        return;
      }

      const res = await fetch('/api/admin/dispatch/queue', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error?.message || 'Failed to load dispatch queue');
        return;
      }

      setQueue(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dispatch queue');
    } finally {
      setBusy(false);
    }
  };

  const loadCandidates = async (dispatchId: string) => {
    setBusy(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('You must be signed in.');
        return;
      }

      const res = await fetch('/api/admin/dispatch/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dispatch_id: dispatchId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error?.message || 'Failed to load candidates');
        return;
      }

      setCandidates(json?.data?.candidates || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load candidates');
    } finally {
      setBusy(false);
    }
  };

  const assignVolunteer = async (dispatchId: string, volunteerId: string) => {
    setBusy(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('You must be signed in.');
        return;
      }

      const res = await fetch('/api/admin/dispatch/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dispatch_id: dispatchId, volunteer_id: volunteerId, mode: 'ASSIGN_AND_NOTIFY' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error?.message || 'Failed to assign volunteer');
        return;
      }

      await loadQueue();
      setCandidates([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign volunteer');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      loadQueue();
    }
  }, [loading, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-3xl mx-auto">
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Please sign in to access the moderator dispatch queue.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dispatch Queue</h1>
            <p className="text-sm text-zinc-400">Requests are created in the app. Assignments happen here.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadQueue} disabled={busy} variant="outline">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link href="/">
              <Button variant="outline">Home</Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">Pending Requests</span>
                <Badge variant="secondary">{queue.length}</Badge>
              </div>
            </div>
            <div className="divide-y divide-zinc-800">
              {queue.length === 0 ? (
                <div className="p-6 text-zinc-400 text-sm">No pending dispatch requests.</div>
              ) : (
                queue.map((d) => (
                  <button
                    key={d.id}
                    className={`w-full text-left p-4 hover:bg-zinc-900 transition-colors ${selectedId === d.id ? 'bg-zinc-900' : ''}`}
                    onClick={() => {
                      setSelectedId(d.id);
                      setCandidates([]);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={d.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>{d.priority}</Badge>
                          <span className="font-medium">{d.request_type}</span>
                          <span className="text-zinc-400 text-sm">{d.county}</span>
                        </div>
                        <div className="text-sm text-zinc-300">{d.species} ({d.animal_size})</div>
                        <div className="text-xs text-zinc-500">{d.pickup_address}</div>
                      </div>
                      <div className="text-right text-xs text-zinc-500">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(d.requested_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="font-medium">Assignment</div>
              {selected && (
                <Button
                  onClick={() => loadCandidates(selected.id)}
                  disabled={busy}
                  variant="outline"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Find Candidates
                </Button>
              )}
            </div>

            {!selected ? (
              <div className="p-6 text-zinc-400 text-sm">Select a dispatch request to assign.</div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={selected.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>{selected.priority}</Badge>
                    <span className="font-medium">{selected.request_type}</span>
                    <span className="text-zinc-400 text-sm">{selected.county}</span>
                  </div>
                  <div className="text-sm text-zinc-300">{selected.species} ({selected.animal_size})</div>
                  <div className="text-xs text-zinc-500">{selected.pickup_address}</div>
                </div>

                {selected.volunteer_id ? (
                  <div className="border border-zinc-800 rounded p-3 bg-zinc-950/30">
                    <div className="text-sm">
                      Assigned to: <span className="font-medium">{selected.volunteer_name}</span>
                    </div>
                    <div className="text-xs text-zinc-500">{selected.volunteer_phone}</div>
                    <div className="text-xs text-zinc-500">Status: {selected.status}</div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-400">Not assigned yet.</div>
                )}

                {candidates.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Candidates</div>
                    <div className="space-y-2">
                      {candidates.map((c) => (
                        <div key={c.volunteer_id} className="border border-zinc-800 rounded p-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{c.volunteer_name}</div>
                            <div className="text-xs text-zinc-500">{c.volunteer_phone}</div>
                            <div className="text-xs text-zinc-500">
                              {c.is_available_now ? 'Available now' : 'Not marked available'}
                              {c.last_active_at ? ` • last active ${new Date(c.last_active_at).toLocaleString()}` : ''}
                            </div>
                          </div>
                          <Button
                            disabled={busy || !!selected.volunteer_id}
                            onClick={() => assignVolunteer(selected.id, c.volunteer_id)}
                          >
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          Note: Assignment updates the shared <code>dispatch_requests</code> row. The app continues to drive execution (ARRIVED/COMPLETED).
        </div>
      </div>
    </div>
  );
}
