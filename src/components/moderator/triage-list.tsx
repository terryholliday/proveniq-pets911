'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  AlertTriangle, 
  MapPin, 
  ChevronRight,
  Lock,
  Building,
  Eye,
  Camera
} from 'lucide-react';
import type { MissingPetCase, FoundAnimalCase, CaseStatus } from '@/lib/types';

type CaseItem = (MissingPetCase | FoundAnimalCase) & { type: 'missing' | 'found' };

interface TriageListProps {
  cases: CaseItem[];
  onSelectCase: (caseItem: CaseItem) => void;
  onLockCase: (caseId: string, caseType: 'missing' | 'found') => void;
  onEscalate: (caseId: string, caseType: 'missing' | 'found') => void;
}

/**
 * Triage list for PigPig moderators
 * Per task spec: lock case, escalate to shelter
 */
export function TriageList({ cases, onSelectCase, onLockCase, onEscalate }: TriageListProps) {
  const [filter, setFilter] = useState<'all' | 'missing' | 'found'>('all');
  const router = useRouter();

  const filteredCases = cases.filter(c => {
    if (filter === 'all') return true;
    return c.type === filter;
  });

  // Sort by priority (critical first, then by recency)
  const sortedCases = [...filteredCases].sort((a, b) => {
    // Found cases with needs_immediate_vet first
    const aUrgent = a.type === 'found' && (a as FoundAnimalCase).needs_immediate_vet;
    const bUrgent = b.type === 'found' && (b as FoundAnimalCase).needs_immediate_vet;
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;
    
    // Then by created_at (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({cases.length})
        </Button>
        <Button
          variant={filter === 'missing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('missing')}
        >
          Missing ({cases.filter(c => c.type === 'missing').length})
        </Button>
        <Button
          variant={filter === 'found' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('found')}
        >
          Found ({cases.filter(c => c.type === 'found').length})
        </Button>
      </div>

      {sortedCases.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No cases to review
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedCases.map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              caseItem={caseItem}
              onSelect={() => router.push(`/case/${caseItem.id}`)}
              onLock={() => onLockCase(caseItem.id, caseItem.type)}
              onEscalate={() => onEscalate(caseItem.id, caseItem.type)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CaseCard({
  caseItem,
  onSelect,
  onLock,
  onEscalate,
}: {
  caseItem: CaseItem;
  onSelect: () => void;
  onLock: () => void;
  onEscalate: () => void;
}) {
  const isFound = caseItem.type === 'found';
  const foundCase = isFound ? (caseItem as FoundAnimalCase) : null;
  const missingCase = !isFound ? (caseItem as MissingPetCase) : null;

  const isUrgent = foundCase?.needs_immediate_vet;

  return (
    <Card className={isUrgent ? 'border-red-300 bg-red-50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Photo Thumbnail */}
          <div className="flex-shrink-0">
            {caseItem.photo_urls && caseItem.photo_urls.length > 0 ? (
              <img
                src={caseItem.photo_urls[0]}
                alt={missingCase?.pet_name || caseItem.species}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                <Camera className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={isFound ? 'warning' : 'default'}>
                {isFound ? 'Found' : 'Missing'}
              </Badge>
              {isUrgent && (
                <Badge variant="critical">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Urgent Care
                </Badge>
              )}
              <StatusBadge status={caseItem.status} />
            </div>

            <h3 className="font-semibold">
              {missingCase?.pet_name || `${caseItem.species} - ${caseItem.case_reference}`}
            </h3>

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {caseItem.county}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(caseItem.created_at)}
              </span>
            </div>

            {foundCase?.condition_notes && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {foundCase.condition_notes}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <Button variant="ghost" size="sm" onClick={onSelect}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button variant="ghost" size="sm" onClick={onLock}>
              <Lock className="h-4 w-4 mr-1" />
              Lock
            </Button>
            {isFound && (
              <Button variant="ghost" size="sm" onClick={onEscalate}>
                <Building className="h-4 w-4 mr-1" />
                Shelter
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const variants: Record<CaseStatus, { variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; label: string }> = {
    ACTIVE: { variant: 'success', label: 'Active' },
    PENDING_VERIFY: { variant: 'warning', label: 'Pending' },
    MATCHED: { variant: 'default', label: 'Matched' },
    CLOSED_REUNITED: { variant: 'secondary', label: 'Reunited' },
    CLOSED_ADOPTED: { variant: 'secondary', label: 'Adopted' },
    CLOSED_DECEASED: { variant: 'destructive', label: 'Deceased' },
    CLOSED_EXPIRED: { variant: 'secondary', label: 'Expired' },
    CLOSED_DUPLICATE: { variant: 'secondary', label: 'Duplicate' },
    LOCKED: { variant: 'destructive', label: 'Locked' },
  };

  const config = variants[status] || { variant: 'secondary', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}
