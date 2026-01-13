'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type SubscriptionEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeSubscriptionOptions<T> {
  table: string;
  schema?: string;
  event?: SubscriptionEvent;
  filter?: string;
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: T) => void;
  onDelete?: (payload: { old: T }) => void;
  onAny?: (eventType: string, payload: any) => void;
  enabled?: boolean;
}

export function useRealtimeSubscription<T = any>({
  table,
  schema = 'public',
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onAny,
  enabled = true,
}: UseRealtimeSubscriptionOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handlePayload = useCallback((payload: any) => {
    const eventType = payload.eventType;
    
    if (onAny) {
      onAny(eventType, payload);
    }

    switch (eventType) {
      case 'INSERT':
        if (onInsert) onInsert(payload.new as T);
        break;
      case 'UPDATE':
        if (onUpdate) onUpdate(payload.new as T);
        break;
      case 'DELETE':
        if (onDelete) onDelete({ old: payload.old as T });
        break;
    }
  }, [onInsert, onUpdate, onDelete, onAny]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channelName = `realtime-${table}-${Date.now()}`;

    const channelConfig: any = {
      event,
      schema,
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, handlePayload)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to ${table}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Error subscribing to ${table}`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, schema, event, filter, enabled, handlePayload]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return { unsubscribe };
}

// Pre-configured hooks for common tables
export function useIncidentsRealtime(callbacks: {
  onInsert?: (incident: any) => void;
  onUpdate?: (incident: any) => void;
}) {
  return useRealtimeSubscription({
    table: 'incidents',
    onInsert: callbacks.onInsert,
    onUpdate: callbacks.onUpdate,
  });
}

export function useShiftsRealtime(callbacks: {
  onInsert?: (shift: any) => void;
  onUpdate?: (shift: any) => void;
  onDelete?: (payload: { old: any }) => void;
}) {
  return useRealtimeSubscription({
    table: 'volunteer_shifts',
    onInsert: callbacks.onInsert,
    onUpdate: callbacks.onUpdate,
    onDelete: callbacks.onDelete,
  });
}

export function useEquipmentRealtime(callbacks: {
  onUpdate?: (equipment: any) => void;
}) {
  return useRealtimeSubscription({
    table: 'equipment',
    onUpdate: callbacks.onUpdate,
  });
}

export function useSafetyAlertsRealtime(callbacks: {
  onInsert?: (alert: any) => void;
  onUpdate?: (alert: any) => void;
}) {
  return useRealtimeSubscription({
    table: 'safety_alerts',
    onInsert: callbacks.onInsert,
    onUpdate: callbacks.onUpdate,
  });
}

export function useSwapRequestsRealtime(callbacks: {
  onInsert?: (swap: any) => void;
  onUpdate?: (swap: any) => void;
}) {
  return useRealtimeSubscription({
    table: 'shift_swap_requests',
    onInsert: callbacks.onInsert,
    onUpdate: callbacks.onUpdate,
  });
}
