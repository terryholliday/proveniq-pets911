'use client';

import { WifiOff, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 bg-zinc-900 rounded-full flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-zinc-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">You're Offline</h1>
        <p className="text-zinc-400 mb-6">
          It looks like you've lost your internet connection. Some features may not be available until you're back online.
        </p>

        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Link href="/">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
          <h3 className="font-medium mb-2 text-sm">While offline, you can still:</h3>
          <ul className="text-xs text-zinc-400 space-y-1 text-left">
            <li>• View previously loaded pages</li>
            <li>• Access cached training materials</li>
            <li>• Draft reports (will sync when online)</li>
          </ul>
        </div>

        <p className="text-xs text-zinc-600 mt-6">
          PetMayday West Virginia • Offline Mode
        </p>
      </div>
    </div>
  );
}
