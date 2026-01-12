'use client';

import { useState } from 'react';
import Link from 'next/link';

// Placeholder fraud review queue
const SAMPLE_FLAGS = [
  { id: '1', type: 'donation', reporter: 'auto-detect', reason: 'Duplicate image detected', status: 'pending', created_at: new Date().toISOString() },
  { id: '2', type: 'post', reporter: 'user123', reason: 'Suspicious fundraiser - no vet records', status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
];

export default function FraudReviewPage() {
  const [flags, setFlags] = useState(SAMPLE_FLAGS);

  const handleResolve = (id: string, action: 'dismiss' | 'remove' | 'ban') => {
    setFlags(flags.filter(f => f.id !== id));
  };

  const typeColors: Record<string, string> = {
    donation: 'bg-green-900 text-green-300',
    post: 'bg-blue-900 text-blue-300',
    user: 'bg-purple-900 text-purple-300',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
          <h1 className="text-2xl font-bold mt-2">🚨 Fraud Review Queue</h1>
          <p className="text-zinc-500 text-sm">Review flagged posts and donation requests</p>
        </div>

        {flags.length === 0 ? (
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-zinc-400">No items pending review</div>
          </div>
        ) : (
          <div className="space-y-4">
            {flags.map(flag => (
              <div key={flag.id} className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${typeColors[flag.type]}`}>
                        {flag.type}
                      </span>
                      <span className="text-sm font-medium">Flagged Content</span>
                    </div>
                    <div className="text-sm text-zinc-400 mt-2">{flag.reason}</div>
                    <div className="text-xs text-zinc-600 mt-1">
                      Reported by: {flag.reporter} • {new Date(flag.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(flag.id, 'dismiss')}
                      className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleResolve(flag.id, 'remove')}
                      className="text-xs bg-orange-800 hover:bg-orange-700 px-3 py-1.5 rounded"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => handleResolve(flag.id, 'ban')}
                      className="text-xs bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded"
                    >
                      Ban User
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4">
          <div className="text-sm font-medium mb-2">Anti-Fraud Tools</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-zinc-800/50 rounded p-3">
              <div className="font-medium">Reverse Image Search</div>
              <div className="text-zinc-500">Detect stolen/recycled photos</div>
            </div>
            <div className="bg-zinc-800/50 rounded p-3">
              <div className="font-medium">Paper Test Request</div>
              <div className="text-zinc-500">Request verification photo</div>
            </div>
            <div className="bg-zinc-800/50 rounded p-3">
              <div className="font-medium">IRS TEOS Check</div>
              <div className="text-zinc-500">Verify 501(c)(3) status</div>
            </div>
            <div className="bg-zinc-800/50 rounded p-3">
              <div className="font-medium">IP/Device Analysis</div>
              <div className="text-zinc-500">Check for multi-account abuse</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
