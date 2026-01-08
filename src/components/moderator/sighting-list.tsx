'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Camera,
  ChevronRight,
} from 'lucide-react';
import type { SightingReportExtended } from '@/lib/types';

type SightingFilter = 'all' | 'high' | 'active' | 'in_progress' | 'resolved';

export function SightingList({ sightings }: { sightings: SightingReportExtended[] }) {
  const [filter, setFilter] = useState<SightingFilter>('all');

  const filtered = useMemo(() => {
    return sightings.filter(s => {
      if (filter === 'all') return true;
      if (filter === 'high') return s.priority === 'HIGH';
      if (filter === 'active') return s.status === 'ACTIVE';
      if (filter === 'in_progress') return s.status === 'IN_PROGRESS';
      if (filter === 'resolved') return s.status === 'RESOLVED';
      return true;
    });
  }, [filter, sightings]);

  if (sightings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">No sightings reported</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
          All ({sightings.length})
        </Button>
        <Button variant={filter === 'high' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('high')}>
          High ({sightings.filter(s => s.priority === 'HIGH').length})
        </Button>
        <Button variant={filter === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('active')}>
          Active ({sightings.filter(s => s.status === 'ACTIVE').length})
        </Button>
        <Button variant={filter === 'in_progress' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('in_progress')}>
          In Progress ({sightings.filter(s => s.status === 'IN_PROGRESS').length})
        </Button>
        <Button variant={filter === 'resolved' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('resolved')}>
          Resolved ({sightings.filter(s => s.status === 'RESOLVED').length})
        </Button>
      </div>

      <Alert variant="info">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Sightings are actionable evidence for matching missing/found cases. High priority sightings indicate the reporter can stay with the animal.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {filtered.map((sighting) => (
          <Card key={sighting.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge variant={sighting.priority === 'HIGH' ? 'destructive' : sighting.priority === 'MEDIUM' ? 'warning' : 'secondary'}>
                      {sighting.priority}
                    </Badge>
                    <Badge variant={sighting.status === 'ACTIVE' ? 'default' : sighting.status === 'IN_PROGRESS' ? 'warning' : 'success'}>
                      {sighting.status}
                    </Badge>
                    <span className="font-semibold">{sighting.species || 'Unknown species'}</span>
                  </CardTitle>
                  <div className="text-sm text-gray-600 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {sighting.sighting_address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(sighting.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/sightings">
                    <Button variant="outline" size="sm">
                      View
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {sighting.photo_url ? (
                    <img
                      src={sighting.photo_url}
                      alt="Sighting"
                      className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-2">{sighting.description}</p>

                  {sighting.missing_case && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Linked missing case:</span>{' '}
                      <span className="font-medium">{sighting.missing_case.pet_name}</span>
                      {sighting.missing_case.owner?.display_name && (
                        <span className="text-gray-600"> (Owner: {sighting.missing_case.owner.display_name})</span>
                      )}
                    </div>
                  )}

                  {sighting.can_stay_with_animal && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle className="h-4 w-4" />
                      Reporter can stay with animal
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}
