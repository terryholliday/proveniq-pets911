'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertTriangle, Heart, Activity } from 'lucide-react';
import type { ConditionTriage } from '@/lib/types';

interface ConditionTriageProps {
  onSelect: (condition: ConditionTriage) => void;
}

/**
 * Step A: Condition triage with 3 massive buttons
 * Per task spec: Critical / Injured stable / Healthy
 */
export function ConditionTriageStep({ onSelect }: ConditionTriageProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">What is the animal&apos;s condition?</CardTitle>
        <CardDescription className="text-base">
          Select the option that best describes the situation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="critical"
          size="massive"
          className="w-full flex flex-col items-center gap-2 h-auto py-6"
          onClick={() => onSelect('CRITICAL')}
        >
          <AlertTriangle className="h-10 w-10" />
          <span className="text-2xl font-bold">CRITICAL</span>
          <span className="text-sm font-normal opacity-90">
            Life-threatening injury, not breathing, severe bleeding, unconscious
          </span>
        </Button>

        <Button
          variant="injured"
          size="massive"
          className="w-full flex flex-col items-center gap-2 h-auto py-6"
          onClick={() => onSelect('INJURED_STABLE')}
        >
          <Activity className="h-10 w-10" />
          <span className="text-2xl font-bold">INJURED - STABLE</span>
          <span className="text-sm font-normal opacity-90">
            Visible injury but alert, limping, minor wounds, needs care but not emergency
          </span>
        </Button>

        <Button
          variant="healthy"
          size="massive"
          className="w-full flex flex-col items-center gap-2 h-auto py-6"
          onClick={() => onSelect('HEALTHY')}
        >
          <Heart className="h-10 w-10" />
          <span className="text-2xl font-bold">HEALTHY</span>
          <span className="text-sm font-normal opacity-90">
            No visible injuries, appears well, just lost or stray
          </span>
        </Button>

        <p className="text-xs text-center text-gray-500 pt-4">
          If unsure, select the more urgent option. Urgent humane care is the priority.
        </p>
      </CardContent>
    </Card>
  );
}
