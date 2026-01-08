'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NetworkStatusBanner } from '@/components/offline/network-status-banner';
import { TriageList } from '@/components/moderator/triage-list';
import { MatchReviewCard } from '@/components/moderator/match-review-card';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  GitMerge, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { fetchMatchSuggestions, resolveMatchSuggestion, recordModeratorAction } from '@/lib/api/client';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { useOfflineQueue } from '@/lib/hooks/use-offline-queue';
import { generateIdempotencyKey } from '@/lib/utils/idempotency';
import type { MatchSuggestion, MissingPetCase, FoundAnimalCase } from '@/lib/types';

type CaseItem = (MissingPetCase | FoundAnimalCase) & { type: 'missing' | 'found' };

/**
 * /admin/pigpig - Moderator Console (PigPig Dashboard)
 * Per CANONICAL_LAW.md: Match suggestions visible ONLY to moderators until confirmed
 */
export default function PigPigDashboard() {
  const [activeTab, setActiveTab] = useState<'triage' | 'matches'>('triage');
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [matches, setMatches] = useState<MatchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state: networkState } = useNetworkStatus();
  const { queueAction } = useOfflineQueue(null); // TODO: Get actual user ID

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, these would be real API calls
      // For now, use mock data
      setCases(getMockCases());
      
      if (networkState !== 'OFFLINE') {
        const matchResponse = await fetchMatchSuggestions();
        if (matchResponse.success && matchResponse.data) {
          setMatches(matchResponse.data.suggestions);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLockCase = async (caseId: string, caseType: 'missing' | 'found') => {
    try {
      if (queueAction) {
        await queueAction('UPDATE_CASE', {
          case_id: caseId,
          case_type: caseType,
          action: 'LOCK_CASE',
        });
      }
    } catch (err) {
      console.error('Failed to queue lock action:', err);
      // Continue anyway - this is a demo
    }
    
    // Update local state
    setCases(prev => prev.map(c => 
      c.id === caseId ? { ...c, status: 'LOCKED' as const } : c
    ));
  };

  const handleEscalate = async (caseId: string, caseType: 'missing' | 'found') => {
    const idempotencyKey = generateIdempotencyKey();
    
    if (networkState === 'OFFLINE') {
      try {
        if (queueAction) {
          await queueAction('UPDATE_CASE', {
            case_id: caseId,
            case_type: caseType,
            action: 'ESCALATE_TO_SHELTER',
          });
        }
      } catch (err) {
        console.error('Failed to queue escalate action:', err);
      }
    } else {
      // TODO: Implement actual escalation
      console.log('Escalating case:', caseId, caseType);
    }
  };

  const handleConfirmMatch = async (matchId: string, notes: string) => {
    const idempotencyKey = generateIdempotencyKey();
    
    const response = await resolveMatchSuggestion(matchId, 'CONFIRMED', notes, idempotencyKey);
    
    if (response.success) {
      setMatches(prev => prev.filter(m => m.match_id !== matchId));
    }
  };

  const handleRejectMatch = async (matchId: string, notes: string) => {
    const idempotencyKey = generateIdempotencyKey();
    
    const response = await resolveMatchSuggestion(matchId, 'REJECTED', notes, idempotencyKey);
    
    if (response.success) {
      setMatches(prev => prev.filter(m => m.match_id !== matchId));
    }
  };

  const handleSelectCase = (caseItem: CaseItem) => {
    // TODO: Navigate to case detail page
    console.log('Selected case:', caseItem.id);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NetworkStatusBanner />

      <header className="bg-purple-600 text-white py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-purple-700">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              <div>
                <h1 className="text-xl font-bold">PigPig Dashboard</h1>
                <p className="text-purple-200 text-sm">Moderator Console</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-white border-white">
              {networkState}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-purple-700"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={<Users className="h-5 w-5 text-blue-600" />}
            label="Active Cases"
            value={cases.filter(c => c.status === 'ACTIVE').length}
          />
          <StatCard
            icon={<GitMerge className="h-5 w-5 text-green-600" />}
            label="Pending Matches"
            value={matches.length}
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            label="Urgent"
            value={cases.filter(c => c.type === 'found' && (c as FoundAnimalCase).needs_immediate_vet).length}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'triage' ? 'default' : 'outline'}
            onClick={() => setActiveTab('triage')}
          >
            <Users className="h-4 w-4 mr-2" />
            Case Triage ({cases.length})
          </Button>
          <Button
            variant={activeTab === 'matches' ? 'default' : 'outline'}
            onClick={() => setActiveTab('matches')}
          >
            <GitMerge className="h-4 w-4 mr-2" />
            Match Review ({matches.length})
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tab Content */}
        {activeTab === 'triage' ? (
          <TriageList
            cases={cases}
            onSelectCase={handleSelectCase}
            onLockCase={handleLockCase}
            onEscalate={handleEscalate}
          />
        ) : (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No pending match suggestions
                </CardContent>
              </Card>
            ) : (
              <>
                <Alert variant="info">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Reminder:</strong> Match suggestions are AI-generated and require 
                    human verification before confirming. Never share match details with 
                    owners until confirmed.
                  </AlertDescription>
                </Alert>
                {matches.map((match) => (
                  <MatchReviewCard
                    key={match.match_id}
                    match={match}
                    onConfirm={handleConfirmMatch}
                    onReject={handleRejectMatch}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-2 bg-gray-100 rounded-lg">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Mock data for development
function getMockCases(): CaseItem[] {
  return [
    {
      id: '1',
      type: 'missing',
      case_reference: 'MP-2024-001',
      status: 'ACTIVE',
      pet_name: 'Buddy',
      species: 'DOG',
      breed: 'Golden Retriever',
      color_primary: 'Golden',
      color_secondary: null,
      distinguishing_features: 'Red collar, friendly',
      weight_lbs: 65,
      age_years: 5,
      sex: 'M',
      is_neutered: true,
      microchip_id: null,
      photo_urls: [],
      last_seen_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      last_seen_lat: 37.7749,
      last_seen_lng: -122.4194,
      last_seen_address: 'Main Street, Lewisburg, WV',
      last_seen_notes: 'Last seen near the park',
      county: 'GREENBRIER',
      owner_id: 'user1',
      assigned_moderator_id: null,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'found',
      case_reference: 'FA-2024-001',
      status: 'ACTIVE',
      species: 'CAT',
      breed_guess: 'Tabby',
      color_primary: 'Orange',
      color_secondary: 'White',
      distinguishing_features: 'Missing left ear tip',
      weight_lbs_estimate: 10,
      age_estimate: 'Adult',
      sex: 'F',
      has_collar: false,
      collar_description: null,
      microchip_scanned: false,
      microchip_id: null,
      condition_notes: 'Appears healthy but frightened',
      needs_immediate_vet: false,
      photo_urls: [],
      found_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      found_lat: 38.3498,
      found_lng: -81.6326,
      found_address: 'Capitol Street, Charleston, WV',
      found_notes: 'Found hiding under a porch',
      current_location_type: 'FINDER_HOME',
      county: 'KANAWHA',
      finder_id: 'user2',
      assigned_moderator_id: null,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      type: 'found',
      case_reference: 'FA-2024-002',
      status: 'ACTIVE',
      species: 'DOG',
      breed_guess: 'Mixed',
      color_primary: 'Black',
      color_secondary: 'Tan',
      distinguishing_features: null,
      weight_lbs_estimate: 30,
      age_estimate: 'Young',
      sex: null,
      has_collar: false,
      collar_description: null,
      microchip_scanned: false,
      microchip_id: null,
      condition_notes: 'Limping on front left leg, needs vet care',
      needs_immediate_vet: true,
      photo_urls: [],
      found_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      found_lat: 37.8024,
      found_lng: -80.4456,
      found_address: 'Route 219, Lewisburg, WV',
      found_notes: 'Found on roadside',
      current_location_type: 'FINDER_VEHICLE',
      county: 'GREENBRIER',
      finder_id: 'user3',
      assigned_moderator_id: null,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}
