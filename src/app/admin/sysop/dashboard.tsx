import Link from 'next/link';

export default function SysopDashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">SYSOP Admin</h1>
          <p className="text-zinc-400 text-sm">
            System operator tools for dispatch oversight and volunteer operations.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/mods/dispatch"
            className="block rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 hover:bg-zinc-900/60 transition-colors"
          >
            <div className="font-medium">Dispatch Queue</div>
            <div className="text-sm text-zinc-400">Review and assign active dispatch requests</div>
          </Link>

          <Link
            href="/training"
            className="block rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 hover:bg-zinc-900/60 transition-colors"
          >
            <div className="font-medium">Training</div>
            <div className="text-sm text-zinc-400">View required modules and completion status</div>
          </Link>
        </div>

        <div className="text-xs text-zinc-500">
          Note: SYSOP access requires ACTIVE volunteer status, capability grant, and completed training modules.
        </div>
      </div>
    </div>
  );
}

