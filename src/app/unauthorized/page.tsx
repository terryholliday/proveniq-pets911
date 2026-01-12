import { Suspense } from 'react';
import UnauthorizedClient from './UnauthorizedClient';

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
          <div className="text-slate-200 text-sm">Loading…</div>
        </div>
      }
    >
      <UnauthorizedClient />
    </Suspense>
  );
}

