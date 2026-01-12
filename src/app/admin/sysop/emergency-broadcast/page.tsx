'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EmergencyBroadcastPage() {
  const [message, setMessage] = useState('');
  const [county, setCounty] = useState('ALL');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    if (!confirm(`Send ${severity.toUpperCase()} broadcast to ${county === 'ALL' ? 'ALL volunteers' : county}?\n\n"${message}"`)) return;

    setSending(true);
    // Simulate sending
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    setMessage('');
    setTimeout(() => setSent(false), 3000);
  };

  const severityColors = {
    info: 'border-blue-600 bg-blue-900/20',
    warning: 'border-yellow-600 bg-yellow-900/20',
    critical: 'border-red-600 bg-red-900/20',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
          <h1 className="text-2xl font-bold mt-2 text-red-400">📢 Emergency Broadcast</h1>
          <p className="text-zinc-500 text-sm">Send push notifications to all volunteers in a region</p>
        </div>

        <div className="border border-red-900/50 rounded-lg bg-red-900/10 p-4">
          <div className="text-sm text-red-400 font-medium mb-2">⚠️ Warning</div>
          <div className="text-xs text-zinc-400">
            Emergency broadcasts are sent immediately to all matching volunteers. Use only for genuine emergencies.
            All broadcasts are logged in the audit trail.
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Severity</label>
            <div className="flex gap-2">
              {(['info', 'warning', 'critical'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`px-4 py-2 rounded border ${severity === s ? severityColors[s] : 'border-zinc-800 bg-zinc-900/30'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Target Region</label>
            <select
              value={county}
              onChange={e => setCounty(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2"
            >
              <option value="ALL">All Regions</option>
              <option value="GREENBRIER">Greenbrier County</option>
              <option value="KANAWHA">Kanawha County</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter your emergency broadcast message..."
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 resize-none"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className={`w-full py-3 rounded font-medium transition-all ${
              sending ? 'bg-zinc-700 text-zinc-400' :
              sent ? 'bg-green-700 text-green-100' :
              'bg-red-700 hover:bg-red-600 text-white'
            }`}
          >
            {sending ? 'Sending...' : sent ? '✓ Broadcast Sent' : '📢 Send Emergency Broadcast'}
          </button>
        </div>

        <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
          <div className="text-sm font-medium mb-2">Recent Broadcasts</div>
          <div className="text-xs text-zinc-500 text-center py-4">No recent broadcasts</div>
        </div>
      </div>
    </div>
  );
}
