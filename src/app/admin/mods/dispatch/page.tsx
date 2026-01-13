'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, RefreshCcw, UserPlus, Users, ShieldAlert, Sparkles, CheckCircle, Star, Truck, Home, Zap, CheckSquare, Square, Trash2, ArrowRight, X } from 'lucide-react';

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

type AutoMatch = {
  volunteer_id: string;
  volunteer_name: string;
  volunteer_phone: string;
  county: string;
  capabilities: string[];
  vehicle_type: string | null;
  can_transport_crate: boolean;
  foster_capacity: number;
  completed_missions: number;
  rating: number;
  is_available: boolean;
  last_active_at: string | null;
  match_score: number;
  match_reasons: string[];
  is_best_match: boolean;
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
  const [autoMatches, setAutoMatches] = useState<AutoMatch[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchMode, setMatchMode] = useState<'auto' | 'manual'>('auto');
  
  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [showBatchActions, setShowBatchActions] = useState(false);

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

  const loadAutoMatch = async (dispatchId: string) => {
    setBusy(true);
    setError(null);
    setAutoMatches([]);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('You must be signed in.');
        return;
      }

      const res = await fetch('/api/admin/dispatch/auto-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dispatch_id: dispatchId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error?.message || 'Failed to find matches');
        return;
      }

      setAutoMatches(json?.data?.matches || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to find matches');
    } finally {
      setBusy(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-zinc-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-900/30 border-green-800';
    if (score >= 60) return 'bg-blue-900/30 border-blue-800';
    if (score >= 40) return 'bg-amber-900/30 border-amber-800';
    return 'bg-zinc-800/30 border-zinc-700';
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

  // Real-time subscription for live updates
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    
    // Subscribe to dispatch_requests changes
    const channel = supabase
      .channel('dispatch-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dispatch_requests',
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            // New ticket - add to queue if pending
            const newRow = payload.new as DispatchRow;
            if (newRow.status === 'PENDING' || !newRow.volunteer_id) {
              setQueue(prev => [newRow, ...prev]);
              // Play notification sound for new tickets
              if (newRow.priority === 'CRITICAL') {
                playNotificationSound();
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as DispatchRow;
            setQueue(prev => {
              // If assigned or completed, remove from queue
              if (updatedRow.volunteer_id && updatedRow.status !== 'PENDING') {
                return prev.filter(d => d.id !== updatedRow.id);
              }
              // Otherwise update in place
              return prev.map(d => d.id === updatedRow.id ? updatedRow : d);
            });
            // Update selected if it's the one being updated
            if (selectedId === updatedRow.id) {
              // Queue will be updated, selection remains
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setQueue(prev => prev.filter(d => d.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedId]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Ignore if autoplay blocked
    } catch {}
  };

  // Batch selection handlers
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setSelectedIds(new Set());
    setShowBatchActions(false);
  };

  const toggleSelectTicket = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
    setShowBatchActions(newSet.size > 0);
  };

  const selectAll = () => {
    setSelectedIds(new Set(queue.map(d => d.id)));
    setShowBatchActions(true);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
    setShowBatchActions(false);
  };

  const handleBatchCancel = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Cancel ${selectedIds.size} selected requests?`)) return;
    
    setBusy(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      
      const supabase = createClient();
      const { error } = await supabase
        .from('dispatch_requests')
        .update({ status: 'CANCELLED' })
        .in('id', Array.from(selectedIds));
      
      if (error) throw error;
      
      await loadQueue();
      setSelectedIds(new Set());
      setShowBatchActions(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Batch cancel failed');
    } finally {
      setBusy(false);
    }
  };

  const handleBatchEscalate = async () => {
    if (selectedIds.size === 0) return;
    
    setBusy(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      
      const supabase = createClient();
      const { error } = await supabase
        .from('dispatch_requests')
        .update({ priority: 'CRITICAL' })
        .in('id', Array.from(selectedIds));
      
      if (error) throw error;
      
      await loadQueue();
      setSelectedIds(new Set());
      setShowBatchActions(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Batch escalate failed');
    } finally {
      setBusy(false);
    }
  };

  const handleBatchReassign = async () => {
    // For reassignment, we need to find a common volunteer
    // This opens the auto-match for batch assignment
    if (selectedIds.size === 0) return;
    alert(`Batch reassignment for ${selectedIds.size} tickets would open volunteer selector. Feature coming soon.`);
  };

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
        {/* Navigation Bar */}
        <div className="flex items-center gap-4 text-sm border-b border-zinc-800 pb-4">
          <Link href="/admin/mods" className="text-blue-400 hover:text-blue-300 font-medium">
            ← Command Center
          </Link>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">Dispatch Queue</span>
        </div>

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
            <Link href="/admin/mods">
              <Button variant="outline">Dashboard</Button>
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
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleBatchMode}
                  variant={batchMode ? 'default' : 'outline'}
                  size="sm"
                  className={batchMode ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  <CheckSquare className="w-4 h-4 mr-1" />
                  {batchMode ? 'Exit Batch' : 'Batch Mode'}
                </Button>
              </div>
            </div>
            
            {/* Batch Actions Bar */}
            {batchMode && showBatchActions && (
              <div className="p-3 border-b border-zinc-800 bg-purple-900/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-purple-600">{selectedIds.size} selected</Badge>
                  <button onClick={selectAll} className="text-xs text-purple-300 hover:underline">Select All</button>
                  <button onClick={deselectAll} className="text-xs text-zinc-400 hover:underline">Clear</button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleBatchEscalate} disabled={busy}>
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Escalate
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBatchReassign} disabled={busy}>
                    <UserPlus className="w-3 h-3 mr-1" />
                    Reassign
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBatchCancel} disabled={busy}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            <div className="divide-y divide-zinc-800">
              {queue.length === 0 ? (
                <div className="p-6 text-zinc-400 text-sm">No pending dispatch requests.</div>
              ) : (
                queue.map((d) => (
                  <div
                    key={d.id}
                    className={`w-full text-left p-4 hover:bg-zinc-900 transition-colors cursor-pointer ${
                      selectedId === d.id ? 'bg-zinc-900' : ''
                    } ${selectedIds.has(d.id) ? 'bg-purple-900/20 border-l-2 border-purple-500' : ''}`}
                    onClick={() => {
                      if (batchMode) {
                        toggleSelectTicket(d.id);
                      } else {
                        setSelectedId(d.id);
                        setCandidates([]);
                        setAutoMatches([]);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {batchMode && (
                          <div className="pt-1">
                            {selectedIds.has(d.id) ? (
                              <CheckSquare className="w-4 h-4 text-purple-400" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-500" />
                            )}
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={d.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>{d.priority}</Badge>
                            <span className="font-medium">{d.request_type}</span>
                            <span className="text-zinc-400 text-sm">{d.county}</span>
                          </div>
                          <div className="text-sm text-zinc-300">{d.species} ({d.animal_size})</div>
                          <div className="text-xs text-zinc-500">{d.pickup_address}</div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-zinc-500">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(d.requested_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="font-medium">Assignment</div>
              {selected && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => loadAutoMatch(selected.id)}
                    disabled={busy}
                    variant={matchMode === 'auto' ? 'default' : 'outline'}
                    className={matchMode === 'auto' ? 'bg-gradient-to-r from-purple-600 to-blue-600' : ''}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Auto-Match
                  </Button>
                  <Button
                    onClick={() => loadCandidates(selected.id)}
                    disabled={busy}
                    variant="outline"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    All Candidates
                  </Button>
                </div>
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
                  <div className="border border-green-800 rounded p-3 bg-green-900/20">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Assigned to: <span className="font-medium">{selected.volunteer_name}</span>
                    </div>
                    <div className="text-xs text-zinc-500">{selected.volunteer_phone}</div>
                    <div className="text-xs text-zinc-500">Status: {selected.status}</div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-400">Not assigned yet. Click Auto-Match for best recommendations.</div>
                )}

                {/* Auto-Match Results */}
                {autoMatches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      AI-Powered Matches
                      <Badge variant="outline" className="text-xs">{autoMatches.length} found</Badge>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {autoMatches.map((match, idx) => (
                        <div 
                          key={match.volunteer_id} 
                          className={`border rounded p-3 ${match.is_best_match ? 'border-green-600 bg-green-900/20' : getScoreBg(match.match_score)}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {match.is_best_match && (
                                  <Badge className="bg-green-600 text-white text-xs">Best Match</Badge>
                                )}
                                <span className="font-medium">{match.volunteer_name}</span>
                                <span className={`text-sm font-bold ${getScoreColor(match.match_score)}`}>
                                  {match.match_score}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                                <span>{match.county}</span>
                                <span>•</span>
                                <span>{match.volunteer_phone}</span>
                                {match.is_available && (
                                  <>
                                    <span>•</span>
                                    <span className="text-green-400">Available</span>
                                  </>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {match.capabilities.map(cap => (
                                  <span key={cap} className={`text-xs px-1.5 py-0.5 rounded ${
                                    cap === 'TRANSPORT' ? 'bg-blue-900/50 text-blue-300' :
                                    cap === 'FOSTER' ? 'bg-green-900/50 text-green-300' :
                                    'bg-red-900/50 text-red-300'
                                  }`}>
                                    {cap === 'TRANSPORT' && <Truck className="w-3 h-3 inline mr-1" />}
                                    {cap === 'FOSTER' && <Home className="w-3 h-3 inline mr-1" />}
                                    {cap === 'EMERGENCY' && <Zap className="w-3 h-3 inline mr-1" />}
                                    {cap}
                                  </span>
                                ))}
                                {match.vehicle_type && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">{match.vehicle_type}</span>
                                )}
                                {match.can_transport_crate && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Crate OK</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {match.match_reasons.map((reason, i) => (
                                  <span key={i} className="text-xs text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                                    ✓ {reason}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-400" />
                                  {match.rating.toFixed(1)}
                                </span>
                                <span>{match.completed_missions} missions</span>
                              </div>
                            </div>
                            <Button
                              disabled={busy || !!selected.volunteer_id}
                              onClick={() => assignVolunteer(selected.id, match.volunteer_id)}
                              className={match.is_best_match ? 'bg-green-600 hover:bg-green-700' : ''}
                              size="sm"
                            >
                              Assign
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Candidates */}
                {candidates.length > 0 && autoMatches.length === 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">All Candidates</div>
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
                            size="sm"
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
