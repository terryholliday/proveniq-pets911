'use client';

/**
 * ACO Dashboard
 * 
 * Animal Control Officer command center for:
 * - Viewing dispatch queue
 * - Managing shift handoffs
 * - Logging outcomes
 * - Viewing accountability metrics
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
  current_role: string;
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

export default function ACODashboard() {
  const [dispatches, setDispatches] = useState<ACODispatch[]>([]);
  const [onDuty, setOnDuty] = useState<OnDutyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDispatch, setSelectedDispatch] = useState<ACODispatch | null>(null);
  const [resolutionCode, setResolutionCode] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [county, setCounty] = useState<'GREENBRIER' | 'KANAWHA'>('GREENBRIER');

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [county]);

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
      loadData();
    }
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
      setSelectedDispatch(null);
      setResolutionCode('');
      setResolutionNotes('');
      loadData();
    }
  }

  async function goOffDuty() {
    // Record shift handoff to 911
    await supabase.rpc('record_shift_handoff', {
      p_county: county,
      p_from_role: 'ACO_OFFICER',
      p_from_officer_id: null,
      p_from_911_id: null,
      p_to_role: 'DISPATCH_911',
      p_to_officer_id: null,
      p_to_911_id: null,
      p_reason: 'END_OF_SHIFT',
      p_notes: null,
    });
    loadData();
  }

  const pendingCount = dispatches.filter(d => d.status === 'PENDING').length;
  const activeCount = dispatches.filter(d => ['ACCEPTED', 'EN_ROUTE', 'ARRIVED'].includes(d.status)).length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ACO Command Center</h1>
            <p className="text-blue-200 text-sm">Animal Control Officer Dashboard</p>
            <Link href="/admin/aco/register" className="text-xs text-blue-300 hover:text-white mr-3">
              Register →
            </Link>
            <Link href="/admin/aco/schedule" className="text-xs text-blue-300 hover:text-white mr-3">
              Schedule →
            </Link>
            <Link href="/admin/aco/metrics" className="text-xs text-blue-300 hover:text-white">
              Metrics →
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value as 'GREENBRIER' | 'KANAWHA')}
              className="bg-blue-800 text-white px-3 py-2 rounded"
            >
              <option value="GREENBRIER">Greenbrier County</option>
              <option value="KANAWHA">Kanawha County</option>
            </select>
            <button
              onClick={goOffDuty}
              className="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded font-medium"
            >
              Hand Off to 911
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-red-600">{pendingCount}</div>
            <div className="text-gray-600">Pending Dispatches</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-blue-600">{activeCount}</div>
            <div className="text-gray-600">Active Dispatches</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-600">On Duty</div>
            <div className="text-lg font-bold">
              {onDuty?.current_role === 'ACO_OFFICER' ? 'ACO' : 
               onDuty?.current_role === 'DISPATCH_911' ? '911 Center' : 'Unknown'}
            </div>
            {onDuty?.on_duty_since && (
              <div className="text-xs text-gray-500">
                Since {new Date(onDuty.on_duty_since).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Dispatch Queue */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">Dispatch Queue</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : dispatches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No active dispatches</div>
          ) : (
            <div className="divide-y">
              {dispatches.map((dispatch) => (
                <div
                  key={dispatch.id}
                  className={`p-4 ${
                    dispatch.priority === 'CRITICAL' ? 'bg-red-50' :
                    dispatch.priority === 'HIGH' ? 'bg-amber-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          dispatch.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
                          dispatch.priority === 'HIGH' ? 'bg-amber-500 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {dispatch.priority}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          dispatch.status === 'PENDING' ? 'bg-red-100 text-red-700' :
                          dispatch.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {dispatch.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {dispatch.source_case_type} • {new Date(dispatch.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="font-medium">{dispatch.pickup_address}</div>
                      <div className="text-sm text-gray-600">
                        {dispatch.species} • Reporter: {dispatch.requester_name} ({dispatch.requester_phone})
                      </div>

                      {dispatch.law_triggers && dispatch.law_triggers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {dispatch.law_triggers.map((trigger) => (
                            <span key={trigger} className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">
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
                        <button
                          onClick={() => acknowledgeDispatch(dispatch.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Acknowledge
                        </button>
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
      </main>

      {/* Resolution Modal */}
      {selectedDispatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Resolve Dispatch</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Resolution Code</label>
              <select
                value={resolutionCode}
                onChange={(e) => setResolutionCode(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select outcome...</option>
                {RESOLUTION_CODES.map((code) => (
                  <option key={code.value} value={code.value}>{code.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={3}
                placeholder="Additional details..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedDispatch(null)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
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
