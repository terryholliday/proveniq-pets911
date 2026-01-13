'use client';

import Link from 'next/link';
import { BarChart3, ArrowLeft } from 'lucide-react';

export default function ModeratorAnalyticsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/mods" className="text-zinc-400 hover:text-zinc-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="text-zinc-400 mt-1">Operations metrics and reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 text-center">
          <BarChart3 className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Analytics Dashboard</h2>
          <p className="text-zinc-400 mb-4">
            This section will include: Response times, completion rates, volunteer performance, 
            county coverage maps, and trend analysis.
          </p>
          <p className="text-sm text-zinc-500">Feature coming soon</p>
        </div>
      </div>
    </div>
  );
}
