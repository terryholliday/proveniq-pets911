'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Escalation {
  id: string;
  case_id: string;
  escalation_level: 'standard' | 'high' | 'critical';
  county: string;
  tier: number;
  unassigned_minutes: number;
  action_taken: string;
  created_at: string;
}

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchEscalations();
  }, []);

  const fetchEscalations = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('alert_type', 'case_escalation')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      const escalations = data.map(alert => ({
        id: alert.id,
        case_id: alert.metadata?.case_id as string || '',
        escalation_level: (alert.severity === 'critical' ? 'critical' :
                         alert.severity === 'warning' ? 'high' : 'standard') as 'standard' | 'high' | 'critical',
        county: alert.metadata?.county as string || '',
        tier: alert.metadata?.tier as number || 1,
        unassigned_minutes: alert.metadata?.unassigned_minutes as number || 0,
        action_taken: alert.metadata?.action as string || '',
        created_at: alert.created_at,
      }));
      setEscalations(escalations);
    }
    setLoading(false);
  };

  const runEscalationCheck = async () => {
    setRunning(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('check_case_escalation');
    if (!error) {
      alert(`Escalation check completed:\n${JSON.stringify(data, null, 2)}`);
      fetchEscalations();
    } else {
      alert('Error: ' + error.message);
    }
    setRunning(false);
  };

  const levelColors = {
    standard: 'border-blue-600 bg-blue-900/20 text-blue-300',
    high: 'border-yellow-600 bg-yellow-900/20 text-yellow-300',
    critical: 'border-red-600 bg-red-900/20 text-red-300',
  };

  const levelIcons = {
    standard: '📡',
    high: '⚠️',
    critical: '🚨',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2">🚨 Case Escalations</h1>
            <p className="text-zinc-500 text-sm">Auto-escalated unassigned cases</p>
          </div>
          <button
            onClick={runEscalationCheck}
            disabled={running}
            className="text-xs bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded disabled:opacity-50"
          >
            {running ? 'Running...' : 'Check Now'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading escalations...</div>
        ) : escalations.length === 0 ? (
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-zinc-400">No escalated cases</div>
            <div className="text-xs text-zinc-600 mt-2">Cases auto-escalate after 15 minutes unassigned</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-zinc-500 mb-4">
              {escalations.length} escalated cases in the last 24 hours
            </div>
            {escalations.map(escalation => (
              <div
                key={escalation.id}
                className={`border rounded-lg p-4 ${levelColors[escalation.escalation_level]}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{levelIcons[escalation.escalation_level]}</span>
                      <span className="font-medium">
                        Tier {escalation.tier} Case • {escalation.county}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        escalation.escalation_level === 'critical' ? 'bg-red-800' :
                        escalation.escalation_level === 'high' ? 'bg-yellow-800' : 'bg-blue-800'
                      }`}>
                        {escalation.escalation_level}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-400 mb-1">
                      Unassigned for {escalation.unassigned_minutes} minutes
                    </div>
                    <div className="text-sm text-zinc-400">
                      Action: {escalation.action_taken}
                    </div>
                    <div className="text-xs text-zinc-600 mt-2">
                      Case ID: {escalation.case_id} • {new Date(escalation.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Escalation Rules */}
        <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
          <div className="text-sm font-medium mb-3">📋 Escalation Rules</div>
          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">15 min</span>
              <span>→ Notify nearby counties</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">30 min</span>
              <span>→ Expand search radius</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">60 min</span>
              <span>→ Critical escalation to all supervisors</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
