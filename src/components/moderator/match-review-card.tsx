'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MapPin,
  Clock,
  Scale,
  Info
} from 'lucide-react';
import type { MatchSuggestion } from '@/lib/types';

interface MatchReviewCardProps {
  match: MatchSuggestion;
  onConfirm: (matchId: string, notes: string) => Promise<void>;
  onReject: (matchId: string, notes: string) => Promise<void>;
}

/**
 * Match review card for moderators
 * Per CANONICAL_LAW.md: Match suggestions visible ONLY to moderators until confirmed
 * Per AI_GUARDRAILS.md: Must include disclosure "AI-suggested match. Moderator verification required."
 */
export function MatchReviewCard({ match, onConfirm, onReject }: MatchReviewCardProps) {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<'confirm' | 'reject' | null>(null);

  const confidencePercent = Math.round(match.confidence_score * 100);
  const confidenceLevel = 
    confidencePercent >= 80 ? 'High' :
    confidencePercent >= 60 ? 'Moderate' : 'Low';

  const handleConfirm = async () => {
    setIsProcessing(true);
    setAction('confirm');
    try {
      await onConfirm(match.match_id, notes);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setAction('reject');
    try {
      await onReject(match.match_id, notes);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Possible Match (Unverified)</CardTitle>
          <ConfidenceBadge level={confidenceLevel} percent={confidencePercent} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Advisory - Required per AI_GUARDRAILS.md */}
        <Alert variant="info" className="bg-orange-50 border-orange-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-800 font-medium">
            ⚠️ SAFETY FIRST: This is an AI-suggested match that has NOT been verified.
            Human review is REQUIRED before any contact with pet owners to prevent false hope.
          </AlertDescription>
        </Alert>
        
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            {match.ai_advisory || 'AI-suggested match. Moderator verification required.'}
          </AlertDescription>
        </Alert>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Missing Pet */}
          <div className="space-y-2">
            <Badge variant="destructive">Missing</Badge>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {match.missing_case.photo_url ? (
                <img 
                  src={match.missing_case.photo_url} 
                  alt={match.missing_case.pet_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Photo
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold">{match.missing_case.pet_name}</p>
              <p className="text-sm text-gray-500">
                {match.missing_case.species} - {match.missing_case.breed || 'Unknown breed'}
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Last seen: {formatDate(match.missing_case.last_seen_at)}
              </p>
            </div>
          </div>

          {/* Found Animal */}
          <div className="space-y-2">
            <Badge variant="warning">Found</Badge>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {match.found_case.photo_url ? (
                <img 
                  src={match.found_case.photo_url} 
                  alt="Found animal"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Photo
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold">{match.found_case.case_reference}</p>
              <p className="text-sm text-gray-500">
                {match.found_case.species} - {match.found_case.breed_guess || 'Unknown breed'}
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Found: {formatDate(match.found_case.found_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Scoring factors */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Match Factors
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <FactorRow 
              label="Species" 
              value={match.scoring_factors.species_match ? 'Match' : 'No'} 
              positive={match.scoring_factors.species_match}
            />
            <FactorRow 
              label="Breed" 
              value={`${Math.round(match.scoring_factors.breed_similarity * 100)}%`}
              positive={match.scoring_factors.breed_similarity > 0.7}
            />
            <FactorRow 
              label="Color" 
              value={`${Math.round(match.scoring_factors.color_match * 100)}%`}
              positive={match.scoring_factors.color_match > 0.7}
            />
            <FactorRow 
              label="Size" 
              value={`${Math.round(match.scoring_factors.size_match * 100)}%`}
              positive={match.scoring_factors.size_match > 0.7}
            />
            <FactorRow 
              label="Distance" 
              value={`${match.scoring_factors.location_proximity_km.toFixed(1)} km`}
              positive={match.scoring_factors.location_proximity_km < 5}
            />
            <FactorRow 
              label="Time Gap" 
              value={`${Math.round(match.scoring_factors.time_gap_hours)} hours`}
              positive={match.scoring_factors.time_gap_hours < 48}
            />
          </div>
        </div>

        {/* Notes input */}
        <div>
          <label className="text-sm font-medium">Resolution Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about your decision..."
            className="w-full mt-1 p-2 border rounded-lg text-sm resize-none"
            rows={2}
          />
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="success"
          className="flex-1"
          onClick={handleConfirm}
          disabled={isProcessing || confidencePercent < 70}
          title={confidencePercent < 70 ? 'Low confidence matches should be rejected for safety' : ''}
        >
          {isProcessing && action === 'confirm' ? (
            'Processing...'
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Match {confidencePercent < 70 ? '(Low Confidence)' : ''}
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={handleReject}
          disabled={isProcessing}
        >
          {isProcessing && action === 'reject' ? (
            'Processing...'
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-2" />
              Reject for Safety
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function ConfidenceBadge({ level, percent }: { level: string; percent: number }) {
  const variant = 
    level === 'High' ? 'success' :
    level === 'Moderate' ? 'warning' : 'secondary';

  return (
    <Badge variant={variant}>
      {percent}% - {level} Confidence
    </Badge>
  );
}

function FactorRow({ 
  label, 
  value, 
  positive 
}: { 
  label: string; 
  value: string; 
  positive: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}:</span>
      <span className={positive ? 'text-green-600 font-medium' : 'text-gray-600'}>
        {value}
      </span>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
