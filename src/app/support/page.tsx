'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SupportCompanionChat from '@/components/support/SupportCompanionChat';

export default function SupportPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-2xl mx-auto h-screen">
        <SupportCompanionChat onClose={() => router.back()} />
      </div>
    </div>
  );
}
