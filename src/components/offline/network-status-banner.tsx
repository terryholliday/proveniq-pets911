'use client';

import { useNetworkStatus, getNetworkStateColor, getNetworkStateText } from '@/lib/hooks/use-network-status';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

/**
 * Network status banner per OFFLINE_PROTOCOL.md visual indicators
 */
export function NetworkStatusBanner() {
  const { state } = useNetworkStatus();

  // Don't show banner when online
  if (state === 'ONLINE') {
    return null;
  }

  const variant = state === 'OFFLINE' ? 'offline' : 'degraded';
  const Icon = state === 'OFFLINE' ? WifiOff : AlertTriangle;

  return (
    <Alert variant={variant} className="rounded-none border-x-0 border-t-0">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <AlertDescription className="font-medium">
          {getNetworkStateText(state)}
        </AlertDescription>
      </div>
    </Alert>
  );
}

/**
 * Small network indicator dot for headers
 */
export function NetworkStatusDot() {
  const { state } = useNetworkStatus();
  const color = getNetworkStateColor(state);

  return (
    <div 
      className="h-2 w-2 rounded-full"
      style={{ backgroundColor: color }}
      title={getNetworkStateText(state)}
    />
  );
}
