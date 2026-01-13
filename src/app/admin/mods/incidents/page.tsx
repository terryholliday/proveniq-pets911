'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ModeratorIncidentsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/mods" className="text-zinc-400 hover:text-zinc-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Incident Reports</h1>
              <p className="text-zinc-400 mt-1">Review and manage incident reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Incident Management</h2>
          <p className="text-zinc-400 mb-4">
            This section will include: Incident reports, escalations, resolution tracking, 
            and safety alerts.
          </p>
          <p className="text-sm text-zinc-500">Feature coming soon</p>
        </div>
      </div>
    </div>
  );
}
