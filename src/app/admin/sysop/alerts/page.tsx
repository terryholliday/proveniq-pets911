'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Alert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  user_id: string | null;
  title: string;
  message: string | null;
  metadata: Record<string, unknown>;
  acknowledged_at: string | null;
  created_at: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unack' | 'critical'>('unack');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('system_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setAlerts(data);
    }
    setLoading(false);
  };

  const acknowledgeAlert = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from('system_alerts')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('id', id);
    fetchAlerts();
  };

  const acknowledgeAll = async () => {
    const supabase = createClient();
    await supabase
      .from('system_alerts')
      .update({ acknowledged_at: new Date().toISOString() })
      .is('acknowledged_at', null);
    fetchAlerts();
  };

  const runWorkflows = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('run_daily_workflows');
    if (!error) {
      alert('Workflows completed:\n' + JSON.stringify(data, null, 2));
      fetchAlerts();
    } else {
      alert('Error: ' + error.message);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'unack') return !a.acknowledged_at;
    if (filter === 'critical') return a.severity === 'critical';
    return true;
  });

  const severityColors = {
    info: 'border-blue-600 bg-blue-900/20 text-blue-300',
    warning: 'border-yellow-600 bg-yellow-900/20 text-yellow-300',
    critical: 'border-red-600 bg-red-900/20 text-red-300',
  };

  const typeIcons: Record<string, string> = {
    certification_expiring: '🏆',
    burnout_risk: '🔥',
    inactive_volunteer: '😴',
    application_archived: '📦',
    auto_cooldown: '⏸️',
  };

  const unackCount = alerts.filter(a => !a.acknowledged_at).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
            <h1 className="text-2xl font-bold mt-2">🔔 System Alerts</h1>
            <p className="text-zinc-500 text-sm">Automated workflow notifications</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={runWorkflows}
              className="text-xs bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded"
            >
              Run Workflows Now
            </button>
            {unackCount > 0 && (
              <button
                onClick={acknowledgeAll}
                className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded"
              >
                Acknowledge All ({unackCount})
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {(['unack', 'critical', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded ${filter === f ? 'bg-amber-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
            >
              {f === 'unack' ? `Unacknowledged (${unackCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-zinc-400">No alerts to display</div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 ${severityColors[alert.severity]} ${alert.acknowledged_at ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeIcons[alert.alert_type] || '📋'}</span>
                      <span className="font-medium">{alert.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        alert.severity === 'critical' ? 'bg-red-800' :
                        alert.severity === 'warning' ? 'bg-yellow-800' : 'bg-blue-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    {alert.message && (
                      <div className="text-sm text-zinc-400 mt-2">{alert.message}</div>
                    )}
                    <div className="text-xs text-zinc-600 mt-2">
                      {new Date(alert.created_at).toLocaleString()}
                      {alert.acknowledged_at && ' • Acknowledged'}
                    </div>
                  </div>
                  {!alert.acknowledged_at && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded ml-4"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
