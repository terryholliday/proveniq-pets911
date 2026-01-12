'use client';

import { useState } from 'react';
import Link from 'next/link';

// Placeholder audit log - would be populated from actual audit table
const SAMPLE_LOGS = [
  { id: '1', action: 'volunteer.approve', user: 'terry@proveniq.io', target: 'john.doe@email.com', timestamp: new Date().toISOString(), details: 'Approved volunteer application' },
  { id: '2', action: 'certification.issue', user: 'terry@proveniq.io', target: 'jane.smith@email.com', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Issued Trapper Certification' },
  { id: '3', action: 'cooldown.override', user: 'terry@proveniq.io', target: 'mod1@email.com', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Override cooldown - emergency staffing' },
];

export default function AuditLogPage() {
  const [filter, setFilter] = useState('');

  const actionColors: Record<string, string> = {
    'volunteer.approve': 'text-green-400',
    'volunteer.reject': 'text-red-400',
    'certification.issue': 'text-purple-400',
    'certification.revoke': 'text-red-400',
    'cooldown.override': 'text-orange-400',
    'dispatch.assign': 'text-blue-400',
    'broadcast.send': 'text-red-400',
  };

  const filteredLogs = SAMPLE_LOGS.filter(log => 
    !filter || log.action.includes(filter) || log.user.includes(filter) || log.target.includes(filter)
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
          <h1 className="text-2xl font-bold mt-2">📜 Audit Log</h1>
          <p className="text-zinc-500 text-sm">All administrative actions are logged for compliance</p>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Filter by action, user, or target..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="text-left p-3 font-medium text-zinc-400">Timestamp</th>
                <th className="text-left p-3 font-medium text-zinc-400">Action</th>
                <th className="text-left p-3 font-medium text-zinc-400">User</th>
                <th className="text-left p-3 font-medium text-zinc-400">Target</th>
                <th className="text-left p-3 font-medium text-zinc-400">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-t border-zinc-800 hover:bg-zinc-900/30">
                  <td className="p-3 text-zinc-500 font-mono text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className={`p-3 font-mono ${actionColors[log.action] || 'text-zinc-400'}`}>
                    {log.action}
                  </td>
                  <td className="p-3 text-zinc-300">{log.user}</td>
                  <td className="p-3 text-zinc-400">{log.target}</td>
                  <td className="p-3 text-zinc-500">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center text-xs text-zinc-600">
          Note: Full audit logging requires database trigger setup. This is a preview.
        </div>
      </div>
    </div>
  );
}
