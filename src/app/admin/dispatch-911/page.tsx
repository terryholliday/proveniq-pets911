'use client';

/**
 * 911 Dispatch Center Dashboard
 * 
 * After-hours command center for 911 dispatchers to:
 * - View ACO dispatch queue
 * - Acknowledge dispatches on behalf of off-duty ACOs
 * - Route to on-call officers
 * - Log outcomes
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ACODispatch {
  id: string;
  status: string;
  priority: string;
  species: string;
  pickup_address: string;
  requester_name: string;
  requester_phone: string;
  law_triggers: string[];
  legal_basis: string;
  statute_citations: string[];
  created_at: string;
  acknowledged_at: string | null;
  source_case_type: string;
}

interface OnDutyInfo {
  duty_role: string;
  on_duty_since: string;
}

const RESOLUTION_CODES = [
  { value: 'RESOLVED_ON_SCENE', label: 'Resolved on scene' },
  { value: 'ANIMAL_SEIZED', label: 'Animal seized' },
  { value: 'ANIMAL_IMPOUNDED', label: 'Animal impounded' },
  { value: 'OWNER_WARNED', label: 'Owner warned' },
  { value: 'CITATION_ISSUED', label: 'Citation issued' },
  { value: 'REFERRED_TO_PROSECUTOR', label: 'Referred to prosecutor' },
  { value: 'NO_VIOLATION_FOUND', label: 'No violation found' },
  { value: 'UNABLE_TO_LOCATE', label: 'Unable to locate' },
  { value: 'OWNER_COMPLIED', label: 'Owner complied' },
  { value: 'UNFOUNDED', label: 'Unfounded' },
  { value: 'OTHER', label: 'Other' },
];

export default function Dispatch911Dashboard() {
  const [dispatches, setDispatches] = useState<ACODispatch[]>([]);
  const [onDuty, setOnDuty] = useState<OnDutyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDispatch, setSelectedDispatch] = useState<ACODispatch | null>(null);
  const [resolutionCode, setResolutionCode] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [county, setCounty] = useState<'GREENBRIER' | 'KANAWHA'>('GREENBRIER');
  const [isAfterHours, setIsAfterHours] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadData();
    // Check after-hours status
    checkAfterHours();
  }, [county]);

  async function checkAfterHours() {
    const { data } = await supabase.rpc('is_after_hours', { p_county: county });
    setIsAfterHours(data || false);
  }

  async function loadData() {
    setLoading(true);

    // Load ACO dispatches for county
    const { data: dispatchData } = await supabase
      .from('dispatch_requests')
      .select('*')
      .eq('is_aco_dispatch', true)
      .eq('county', county)
      .in('status', ['PENDING', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED'])
      .order('created_at', { ascending: false });

    setDispatches(dispatchData || []);

    // Load on-duty status
    const { data: onDutyData } = await supabase
      .rpc('get_on_duty', { p_county: county });

    if (onDutyData && onDutyData.length > 0) {
      setOnDuty(onDutyData[0]);
    }

    setLoading(false);
  }

  async function acknowledgeDispatch(dispatchId: string) {
    const { error } = await supabase
      .from('dispatch_requests')
      .update({
        status: 'ACCEPTED',
        acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', dispatchId);

    if (!error) {
      // Log the action
      await supabase.from('dispatch_assignments').insert({
        dispatch_request_id: dispatchId,
        action: 'ACCEPTED',
        note: 'Acknowledged by 911 Dispatch',
        meta: { source: '911_dispatch_dashboard' },
      });
      loadData();
    }
  }

  async function routeToACO(dispatchId: string) {
    // TODO: Select specific ACO officer
    alert('Route to ACO functionality - select officer from list');
  }

  async function resolveDispatch() {
    if (!selectedDispatch || !resolutionCode) return;

    const { error } = await supabase
      .from('dispatch_requests')
      .update({
        status: 'COMPLETED',
        resolution_code: resolutionCode,
        resolution_notes: resolutionNotes || null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedDispatch.id);

    if (!error) {
      // Log the action
      await supabase.from('dispatch_assignments').insert({
        dispatch_request_id: selectedDispatch.id,
        action: 'COMPLETED',
        note: `Resolved by 911 Dispatch: ${resolutionCode}`,
        meta: { 
          source: '911_dispatch_dashboard',
          resolution_code: resolutionCode,
        },
      });
      
      setSelectedDispatch(null);
      setResolutionCode('');
      setResolutionNotes('');
      loadData();
    }
  }

  async function takeOverFromACO() {
    // Record shift handoff
    await supabase.rpc('record_shift_handoff', {
      p_county: county,
      p_from_role: 'ACO_OFFICER',
      p_from_officer_id: null,
      p_from_911_id: null,
      p_to_role: 'DISPATCH_911',
      p_to_officer_id: null,
      p_to_911_id: null,
      p_reason: 'AFTER_HOURS_AUTO',
      p_notes: 'Manual takeover by 911 dispatch',
    });
    loadData();
  }

  const pendingCount = dispatches.filter(d => d.status === 'PENDING').length;
  const activeCount = dispatches.filter(d => ['ACCEPTED', 'EN_ROUTE', 'ARRIVED'].includes(d.status)).length;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-indigo-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">911 Dispatch Center</h1>
            <p className="text-indigo-200 text-sm">After-Hours Animal Control Coordination</p>
            <Link href="/admin/dispatch-911/register" className="text-xs text-indigo-300 hover:text-white">
              Register as 911 Dispatcher →
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded text-sm font-medium ${
              isAfterHours ? 'bg-amber-500 text-black' : 'bg-green-500 text-white'
            }`}>
              {isAfterHours ? '🌙 After Hours Active' : '☀️ Business Hours'}
            </div>
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value as 'GREENBRIER' | 'KANAWHA')}
              className="bg-indigo-800 text-white px-3 py-2 rounded"
            >
              <option value="GREENBRIER">Greenbrier County</option>
              <option value="KANAWHA">Kanawha County</option>
            </select>
            {!isAfterHours && (
              <button
                onClick={takeOverFromACO}
                className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded font-medium"
              >
                Take Over from ACO
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Status Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-red-500">{pendingCount}</div>
            <div className="text-gray-400">Pending Dispatches</div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-blue-500">{activeCount}</div>
            <div className="text-gray-400">Active Dispatches</div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-400">Currently On Duty</div>
            <div className="text-lg font-bold text-white">
              {onDuty?.duty_role === 'ACO_OFFICER' ? 'ACO Officer' : 
               onDuty?.duty_role === 'DISPATCH_911' ? '911 Center' : 'Unknown'}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-400">Status</div>
            <div className={`text-lg font-bold ${isAfterHours ? 'text-amber-400' : 'text-green-400'}`}>
              {isAfterHours ? 'After Hours' : 'Business Hours'}
            </div>
          </div>
        </div>

        {/* Dispatch Queue */}
        <div className="bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">ACO Dispatch Queue</h2>
            <button 
              onClick={loadData}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : dispatches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No active dispatches</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {dispatches.map((dispatch) => (
                <div
                  key={dispatch.id}
                  className={`p-4 ${
                    dispatch.priority === 'CRITICAL' ? 'bg-red-900/30' :
                    dispatch.priority === 'HIGH' ? 'bg-amber-900/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          dispatch.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
                          dispatch.priority === 'HIGH' ? 'bg-amber-500 text-black' :
                          'bg-gray-600 text-white'
                        }`}>
                          {dispatch.priority}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          dispatch.status === 'PENDING' ? 'bg-red-500/50 text-red-200' :
                          dispatch.status === 'ACCEPTED' ? 'bg-blue-500/50 text-blue-200' :
                          'bg-green-500/50 text-green-200'
                        }`}>
                          {dispatch.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {dispatch.source_case_type} • {new Date(dispatch.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="font-medium text-white">{dispatch.pickup_address}</div>
                      <div className="text-sm text-gray-400">
                        {dispatch.species} • Reporter: {dispatch.requester_name} ({dispatch.requester_phone})
                      </div>

                      {dispatch.law_triggers && dispatch.law_triggers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {dispatch.law_triggers.map((trigger) => (
                            <span key={trigger} className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded">
                              {trigger.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}

                      {dispatch.statute_citations && dispatch.statute_citations.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          Legal basis: {dispatch.legal_basis} ({dispatch.statute_citations.join(', ')})
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {dispatch.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => acknowledgeDispatch(dispatch.id)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => routeToACO(dispatch.id)}
                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                          >
                            Route to ACO
                          </button>
                        </>
                      )}
                      {['ACCEPTED', 'EN_ROUTE', 'ARRIVED'].includes(dispatch.status) && (
                        <button
                          onClick={() => setSelectedDispatch(dispatch)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-indigo-900/30 border border-indigo-700 rounded-lg">
          <h3 className="font-bold text-indigo-300 mb-2">911 Dispatcher Instructions</h3>
          <ul className="text-sm text-indigo-200 space-y-1">
            <li>• <strong>Acknowledge</strong> dispatches to confirm receipt and begin tracking</li>
            <li>• <strong>Route to ACO</strong> to assign to an on-call officer</li>
            <li>• <strong>Resolve</strong> when outcome is known (required for accountability)</li>
            <li>• All actions are logged with timestamps for audit purposes</li>
          </ul>
        </div>
      </main>

      {/* Resolution Modal */}
      {selectedDispatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white mb-4">Resolve Dispatch</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Resolution Code</label>
              <select
                value={resolutionCode}
                onChange={(e) => setResolutionCode(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2"
              >
                <option value="">Select outcome...</option>
                {RESOLUTION_CODES.map((code) => (
                  <option key={code.value} value={code.value}>{code.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Notes (Optional)</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2"
                rows={3}
                placeholder="Additional details..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedDispatch(null)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={resolveDispatch}
                disabled={!resolutionCode}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Resolve Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
