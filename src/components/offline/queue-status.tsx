'use client';

import { useOfflineQueue, getSyncStatusColor, getActionTypeLabel } from '@/lib/hooks/use-offline-queue';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface QueueStatusProps {
  userId: string | null;
  compact?: boolean;
}

/**
 * Offline queue status display
 * Per OFFLINE_PROTOCOL.md: Show "Queued" status in UI
 */
export function QueueStatus({ userId, compact = false }: QueueStatusProps) {
  const { stats, pendingActions, isSyncing, syncNow } = useOfflineQueue(userId);

  if (compact) {
    if (stats.pending === 0) return null;

    return (
      <div className="flex items-center gap-2 text-sm text-amber-600">
        <Clock className="h-4 w-4" />
        <span>{stats.pending} action{stats.pending !== 1 ? 's' : ''} queued</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={syncNow}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Sync Queue</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={syncNow}
          disabled={isSyncing || stats.pending === 0}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Now
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <StatItem 
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            label="Pending"
            value={stats.pending}
          />
          <StatItem 
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            label="Synced"
            value={stats.synced}
          />
          <StatItem 
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            label="Failed"
            value={stats.failed}
          />
        </div>

        {pendingActions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Pending Actions:</p>
            {pendingActions.slice(0, 5).map((action) => (
              <div 
                key={action.id} 
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="pending">
                    {getActionTypeLabel(action.action_type)}
                  </Badge>
                  {action.sync_attempts > 0 && (
                    <span className="text-xs text-gray-500">
                      Retry {action.sync_attempts}/{5}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(action.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {pendingActions.length > 5 && (
              <p className="text-xs text-gray-400 text-center">
                +{pendingActions.length - 5} more
              </p>
            )}
          </div>
        )}

        {stats.pending === 0 && stats.failed === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            All actions synced
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

/**
 * Compact queued action indicator for headers
 * Per OFFLINE_PROTOCOL.md visual indicators
 */
export function QueuedActionIndicator() {
  const { stats } = useOfflineQueue(null);
  
  if (stats.pending === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
      <Clock className="h-3.5 w-3.5" />
      <span>{stats.pending}</span>
    </div>
  );
}
