'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { NetworkStatusBanner } from '@/components/offline/network-status-banner';
import { ConditionTriageStep } from '@/components/emergency/condition-triage';
import { RoutingCards } from '@/components/emergency/routing-cards';
import { CountySelectorCompact } from '@/components/county/county-selector';
import { QueuedActionIndicator } from '@/components/offline/queue-status';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSelectedCounty } from '@/lib/hooks/use-county-pack';
import { useOfflineQueue } from '@/lib/hooks/use-offline-queue';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { ArrowLeft, MapPin, Info } from 'lucide-react';
import type { ConditionTriage, EmergencyContact, MunicipalOutcome } from '@/lib/types';

/**
 * /emergency - Emergency Finder Assist
 * Per task spec: Step A (triage) → Step B (routing cards)
 * Offline-first: reads ONLY cached data when offline
 */
export default function EmergencyPage() {
  const [selectedCounty, setSelectedCounty] = useSelectedCounty();
  const [condition, setCondition] = useState<ConditionTriage | null>(null);
  const { state: networkState } = useNetworkStatus();
  const { stats, queueAction } = useOfflineQueue(null); // TODO: Get actual user ID

  const handleConditionSelect = (selected: ConditionTriage) => {
    setCondition(selected);
  };

  const handleNotifyVet = useCallback(async (contact: EmergencyContact) => {
    // Queue the notification request (works offline)
    await queueAction('REQUEST_ER_VET_NOTIFY', {
      contact_id: contact.id,
      emergency_summary: `Emergency notification from finder. Condition: ${condition}`,
      callback_number: '', // TODO: Get from user profile
    });
  }, [condition, queueAction]);

  const handleLogOutcome = useCallback(async (outcome: MunicipalOutcome, contactId: string) => {
    // Queue the municipal call log (works offline)
    await queueAction('LOG_MUNICIPAL_CALL', {
      contact_id: contactId,
      case_type: 'found',
      dialer_initiated_at: new Date().toISOString(),
      outcome,
      county: selectedCounty,
    });
  }, [selectedCounty, queueAction]);

  const handleBack = () => {
    setCondition(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NetworkStatusBanner />

      <header className="bg-red-600 text-white py-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-red-700">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Emergency Finder Assist</h1>
              <p className="text-red-100 text-sm">Get help for a found animal</p>
            </div>
          </div>
          <CountySelectorCompact onSelect={setSelectedCounty} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {!selectedCounty ? (
          <Alert variant="warning">
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              Please select your county to access local emergency contacts.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {!condition ? (
              <ConditionTriageStep onSelect={handleConditionSelect} />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Change Condition
                  </Button>
                  <span className="text-sm text-gray-500">
                    {condition === 'CRITICAL' && '🔴 Critical'}
                    {condition === 'INJURED_STABLE' && '🟡 Injured - Stable'}
                    {condition === 'HEALTHY' && '🟢 Healthy'}
                  </span>
                </div>

                <RoutingCards
                  condition={condition}
                  county={selectedCounty}
                  onNotifyVet={handleNotifyVet}
                  onLogOutcome={handleLogOutcome}
                />
              </>
            )}

            {stats.pending > 0 && (
              <QueuedActionIndicator />
            )}

            <Alert variant="info" className="mt-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Offline Mode:</strong> Emergency contacts and call scripts are
                cached locally. All actions will sync when you&apos;re back online.
              </AlertDescription>
            </Alert>
          </>
        )}
      </main>
    </div>
  );
}
