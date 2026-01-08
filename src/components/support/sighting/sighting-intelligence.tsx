'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Info
} from 'lucide-react';
import type { Sighting, SightingIntelligence, SightingCluster } from '@/lib/types';

interface SightingIntelligenceProps {
  intelligence: SightingIntelligence;
  sightings: Sighting[];
  onMarkCredible?: (sightingId: string) => void;
  onMarkNotMyPet?: (sightingId: string) => void;
  onReview?: (sightingId: string) => void;
}

/**
 * Sighting Intelligence module UI
 * Per task spec: "What matters right now" card, hot zones, sighting cards with actions
 * Per AI_GUARDRAILS.md: Must include guardrails messaging
 */
export function SightingIntelligenceModule({
  intelligence,
  sightings,
  onMarkCredible,
  onMarkNotMyPet,
  onReview,
}: SightingIntelligenceProps) {
  return (
    <div className="space-y-4">
      {/* AI Advisory - Required per AI_GUARDRAILS.md */}
      <Alert variant="warning" className="border-amber-300 bg-amber-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-amber-800">
          <strong>Advisory:</strong> {intelligence.advisory || 'AI analysis may be inaccurate. Verify all information independently.'}
        </AlertDescription>
      </Alert>

      {/* What Matters Right Now Card */}
      <WhatMattersCard intelligence={intelligence} />

      {/* Sighting Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recent Sightings ({sightings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sightings.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No sightings reported yet
            </p>
          ) : (
            sightings.map((sighting) => (
              <SightingCard
                key={sighting.id}
                sighting={sighting}
                onMarkCredible={onMarkCredible}
                onMarkNotMyPet={onMarkNotMyPet}
                onReview={onReview}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Guardrails Disclaimer */}
      <div className="bg-gray-100 rounded-lg p-3 text-xs text-gray-500 space-y-1">
        <p className="flex items-center gap-1">
          <Info className="h-3 w-3" />
          <strong>Important:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Sighting data is user-reported and unverified</li>
          <li>Hot zones are approximate areas, not exact locations</li>
          <li>AI analysis is advisory only — may be wrong</li>
          <li>Always verify sightings before taking action</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * "What Matters Right Now" card
 * Shows hot zones, recency, and confidence bounds
 */
function WhatMattersCard({ intelligence }: { intelligence: SightingIntelligence }) {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          What Matters Right Now
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {intelligence.hot_zones.length > 0 ? (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-700">Possible Activity Areas:</p>
              {intelligence.hot_zones.map((zone, index) => (
                <HotZoneRow key={index} zone={zone} />
              ))}
            </div>

            <div className="pt-2 border-t border-blue-200">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Total Sightings:</span>
                <span className="font-medium">{intelligence.total_sightings}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Most Recent:</span>
                <span className="font-medium">
                  {intelligence.recency_hours < 1 
                    ? 'Within the hour' 
                    : `${Math.round(intelligence.recency_hours)} hours ago`}
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-blue-700 text-center py-4">
            Not enough sightings to determine activity areas
          </p>
        )}

        <p className="text-xs text-blue-600 italic">
          Approximate area based on reported sightings. Actual location unknown.
        </p>
      </CardContent>
    </Card>
  );
}

function HotZoneRow({ zone }: { zone: SightingCluster }) {
  const confidenceColors = {
    HIGH: 'text-green-600',
    MEDIUM: 'text-amber-600',
    LOW: 'text-gray-600',
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-lg p-2">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-blue-500" />
        <div>
          <p className="font-medium text-sm">{zone.area_name}</p>
          <p className="text-xs text-gray-500">
            {zone.sighting_count} sighting{zone.sighting_count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant={zone.confidence === 'HIGH' ? 'success' : zone.confidence === 'MEDIUM' ? 'warning' : 'secondary'}>
          {zone.confidence}
        </Badge>
        <p className="text-xs text-gray-400 mt-1">
          <Clock className="h-3 w-3 inline mr-1" />
          {formatTimeAgo(zone.last_sighting_at)}
        </p>
      </div>
    </div>
  );
}

/**
 * Individual sighting card with action buttons
 */
function SightingCard({
  sighting,
  onMarkCredible,
  onMarkNotMyPet,
  onReview,
}: {
  sighting: Sighting;
  onMarkCredible?: (id: string) => void;
  onMarkNotMyPet?: (id: string) => void;
  onReview?: (id: string) => void;
}) {
  const confidenceColors = {
    CERTAIN: 'bg-green-100 text-green-800',
    LIKELY: 'bg-amber-100 text-amber-800',
    UNSURE: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <Badge className={confidenceColors[sighting.confidence_level]}>
            {sighting.confidence_level}
          </Badge>
          {sighting.is_verified && (
            <Badge variant="success">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {formatTimeAgo(sighting.sighting_at)}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        {sighting.sighting_area && (
          <p className="text-sm flex items-center gap-1">
            <MapPin className="h-3 w-3 text-gray-400" />
            {sighting.sighting_area}
          </p>
        )}
        {sighting.description && (
          <p className="text-sm text-gray-600">{sighting.description}</p>
        )}
        {sighting.direction_heading && (
          <p className="text-xs text-gray-500">
            Direction: {sighting.direction_heading}
          </p>
        )}
        {sighting.animal_behavior && (
          <p className="text-xs text-gray-500">
            Behavior: {sighting.animal_behavior}
          </p>
        )}
      </div>

      {/* Action buttons - only for owners/moderators */}
      {(onMarkCredible || onMarkNotMyPet || onReview) && (
        <div className="flex gap-2 pt-2 border-t">
          {onMarkCredible && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onMarkCredible(sighting.id)}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Credible
            </Button>
          )}
          {onMarkNotMyPet && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onMarkNotMyPet(sighting.id)}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Not My Pet
            </Button>
          )}
          {onReview && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onReview(sighting.id)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Review
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
