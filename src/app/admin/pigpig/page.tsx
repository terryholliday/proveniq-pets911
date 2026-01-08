'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NetworkStatusBanner } from '@/components/offline/network-status-banner';
import { TriageList } from '@/components/moderator/triage-list';
import { SightingList } from '@/components/moderator/sighting-list';
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
  MapPin,
  RefreshCw,
  CheckCircle,
  X
} from 'lucide-react';
import { fetchMatchSuggestions, resolveMatchSuggestion, recordModeratorAction } from '@/lib/api/client';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { useOfflineQueue } from '@/lib/hooks/use-offline-queue';
import { generateIdempotencyKey } from '@/lib/utils/idempotency';
import type { MatchSuggestion, MissingPetCase, FoundAnimalCase, CaseStatus, SightingReportExtended } from '@/lib/types';

type CaseItem = (MissingPetCase | FoundAnimalCase) & { type: 'missing' | 'found' };

/**
 * /admin/pigpig - Moderator Console (PigPig Dashboard)
 * Per CANONICAL_LAW.md: Match suggestions visible ONLY to moderators until confirmed
 */
export default function PigPigDashboard() {
  const [activeTab, setActiveTab] = useState<'triage' | 'matches' | 'sightings'>('triage');
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [matches, setMatches] = useState<MatchSuggestion[]>([]);
  const [sightings, setSightings] = useState<SightingReportExtended[]>([]);
  const [isSightingsLoading, setIsSightingsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<{
    variant: 'success' | 'warning' | 'destructive' | 'info';
    message: string;
  } | null>(null);
  const [escalateModal, setEscalateModal] = useState<{
    caseId: string;
    caseType: 'missing' | 'found';
  } | null>(null);
  const [escalateConfirmText, setEscalateConfirmText] = useState('');
  const [escalateAcks, setEscalateAcks] = useState({
    policy: false,
    evidence: false,
    minimize: false,
  });
  const [isEscalating, setIsEscalating] = useState(false);
  const { state: networkState } = useNetworkStatus();
  const { queueAction } = useOfflineQueue(null); // TODO: Get actual user ID

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadSightings = async () => {
    if (networkState === 'OFFLINE') {
      setSightings([]);
      return;
    }

    setIsSightingsLoading(true);
    try {
      const response = await fetch('/api/sightings');
      if (!response.ok) {
        throw new Error('Failed to fetch sightings');
      }
      const data = await response.json();
      setSightings(data.sightings || []);
    } catch (err) {
      console.error('Failed to load sightings:', err);
      setSightings([]);
    } finally {
      setIsSightingsLoading(false);
    }
  };

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

      await loadSightings();
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
    setEscalateModal({ caseId, caseType });
    setEscalateConfirmText('');
    setEscalateAcks({ policy: false, evidence: false, minimize: false });
    setActionBanner(null);
  };

  const confirmEscalate = async () => {
    if (!escalateModal) return;
    const { caseId, caseType } = escalateModal;

    setIsEscalating(true);
    setActionBanner(null);

    const idempotencyKey = generateIdempotencyKey();

    let queueOk = false;
    try {
      if (queueAction) {
        await queueAction('UPDATE_CASE', {
          case_id: caseId,
          case_type: caseType,
          action: 'ESCALATE_TO_SHELTER',
        });
        queueOk = true;
      }
    } catch (err) {
      console.error('Failed to queue escalate action:', err);
    }

    try {
      if (networkState !== 'OFFLINE') {
        await recordModeratorAction(
          {
            action_type: 'ESCALATE_TO_SHELTER',
            case_id: caseId,
            case_type: caseType,
            notes: `Escalation accepted: policy=${escalateAcks.policy}, evidence=${escalateAcks.evidence}, minimize=${escalateAcks.minimize}`,
          },
          idempotencyKey
        );
      }
    } catch (err) {
      console.error('Failed to record moderator action:', err);
    }

    setCases(prev => prev.map(c => (c.id === caseId ? { ...c, status: 'ESCALATED_TO_SHELTER' as const } : c)));

    setEscalateModal(null);
    setEscalateConfirmText('');
    setEscalateAcks({ policy: false, evidence: false, minimize: false });
    setIsEscalating(false);

    if (!queueAction) {
      setActionBanner({
        variant: 'info',
        message: 'Escalation accepted and applied locally. Offline queue is unavailable; sync will occur when backend wiring is in place.',
      });
      return;
    }

    if (!queueOk) {
      setActionBanner({
        variant: 'warning',
        message: 'Escalation accepted and applied locally, but could not be queued for sync. Retry when network/queue is available.',
      });
      return;
    }

    setActionBanner({
      variant: 'success',
      message: 'Escalation accepted and queued for shelter escalation.',
    });
  };

  const handleCloseCase = async (caseId: string, caseType: 'missing' | 'found') => {
    // Show closure reason dialog
    const reasons = [
      'CLOSED_REUNITED - Pet reunited with owner',
      'CLOSED_ADOPTED - Pet was adopted',
      'CLOSED_DECEASED - Pet was found deceased',
      'CLOSED_EXPIRED - Case expired (30 days)',
      'CLOSED_DUPLICATE - Duplicate case'
    ];
    
    const reason = prompt(
      'Select a closure reason:\n\n' +
      reasons.join('\n') +
      '\n\nEnter the reason code (e.g., CLOSED_REUNITED):'
    );

    if (!reason || !reasons.some(r => r.startsWith(reason))) {
      if (reason) alert('Invalid reason code. Please try again.');
      return;
    }

    const idempotencyKey = generateIdempotencyKey();
    
    try {
      if (queueAction) {
        await queueAction('UPDATE_CASE', {
          case_id: caseId,
          case_type: caseType,
          action: 'CLOSE_CASE',
          closure_reason: reason,
        });
      }
      
      // Update local state to reflect closure
      setCases(prev => prev.map(c => 
        c.id === caseId ? { ...c, status: reason as CaseStatus } : c
      ));
      
      // Show success message
      alert(`Case has been closed: ${reason}`);
      
    } catch (err) {
      console.error('Failed to close case:', err);
      alert('Failed to close case. Please try again.');
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
        {actionBanner && (
          <Alert
            variant={actionBanner.variant === 'success' ? 'success' : actionBanner.variant === 'warning' ? 'warning' : actionBanner.variant === 'destructive' ? 'destructive' : 'info'}
            className="mb-4"
          >
            {actionBanner.variant === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : actionBanner.variant === 'destructive' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>{actionBanner.message}</AlertDescription>
          </Alert>
        )}

        {escalateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto border-red-300">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-red-700 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Shelter Escalation — High-Impact Action
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      This action may trigger notifications and partner workflows under the Pet911 Alert Decision Matrix.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (isEscalating) return;
                      setEscalateModal(null);
                      setEscalateConfirmText('');
                      setEscalateAcks({ policy: false, evidence: false, minimize: false });
                    }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Do not escalate</strong> unless:
                    <div className="mt-2 space-y-1">
                      <div>1. Evidence is sufficient and actionable</div>
                      <div>2. The action is justified and policy-compliant</div>
                      <div>3. Data shared will be minimized to what is required</div>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Case ID</span>
                    <span className="font-mono">{escalateModal.caseId}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-slate-600">Case Type</span>
                    <span className="font-medium">{escalateModal.caseType}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-slate-600">Network</span>
                    <span className="font-medium">{networkState}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={escalateAcks.policy}
                      onChange={(e) => setEscalateAcks(prev => ({ ...prev, policy: e.target.checked }))}
                      disabled={isEscalating}
                    />
                    <span>
                      I understand escalation is governed by the Alert Decision Matrix and must avoid panic spam, fraud amplification, and partner misuse.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={escalateAcks.evidence}
                      onChange={(e) => setEscalateAcks(prev => ({ ...prev, evidence: e.target.checked }))}
                      disabled={isEscalating}
                    />
                    <span>
                      I confirm evidence is sufficient (photos, location, description) and this escalation is necessary for reunification outcomes.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={escalateAcks.minimize}
                      onChange={(e) => setEscalateAcks(prev => ({ ...prev, minimize: e.target.checked }))}
                      disabled={isEscalating}
                    />
                    <span>
                      I will minimize disclosure (share only what is needed for the shelter workflow) and accept that all actions are append-only and auditable.
                    </span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Type <span className="font-mono">ESCALATE</span> to confirm</label>
                  <input
                    value={escalateConfirmText}
                    onChange={(e) => setEscalateConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    placeholder="ESCALATE"
                    disabled={isEscalating}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isEscalating) return;
                      setEscalateModal(null);
                      setEscalateConfirmText('');
                      setEscalateAcks({ policy: false, evidence: false, minimize: false });
                    }}
                    disabled={isEscalating}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmEscalate}
                    disabled={
                      isEscalating ||
                      !escalateAcks.policy ||
                      !escalateAcks.evidence ||
                      !escalateAcks.minimize ||
                      escalateConfirmText.trim() !== 'ESCALATE'
                    }
                  >
                    {isEscalating ? 'Escalating…' : 'I Accept — Escalate to Shelter'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
          <Button
            variant={activeTab === 'sightings' ? 'default' : 'outline'}
            onClick={() => setActiveTab('sightings')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Sightings ({sightings.length})
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
            onCloseCase={handleCloseCase}
          />
        ) : activeTab === 'matches' ? (
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
        ) : (
          <div className="space-y-4">
            {isSightingsLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">Loading sightings…</CardContent>
              </Card>
            ) : (
              <SightingList sightings={sightings} />
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
      photo_urls: [
          'https://picsum.photos/seed/buddy-golden-front/400/300.jpg',
          'https://picsum.photos/seed/buddy-golden-side/400/300.jpg',
          'https://picsum.photos/seed/buddy-golden-collar/400/300.jpg'
        ],
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
      photo_urls: [
          'https://picsum.photos/seed/tabby-gray-face/400/300.jpg',
          'https://picsum.photos/seed/tabby-gray-paws/400/300.jpg',
          'https://picsum.photos/seed/tabby-gray-side/400/300.jpg',
          'https://picsum.photos/seed/tabby-gray-tail/400/300.jpg'
        ],
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
      photo_urls: [
          'https://picsum.photos/seed/dog-brown-injured-leg/400/300.jpg',
          'https://picsum.photos/seed/dog-brown-injury-closeup/400/300.jpg',
          'https://picsum.photos/seed/dog-brown-face/400/300.jpg',
          'https://picsum.photos/seed/dog-brown-body/400/300.jpg',
          'https://picsum.photos/seed/dog-brown-carrier/400/300.jpg'
        ],
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
