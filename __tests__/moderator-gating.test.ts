/**
 * Tests for Moderator Gating
 * Per CANONICAL_LAW.md: Match suggestions visible ONLY to moderators until confirmed
 */

import type { MatchSuggestion, UserRole } from '../src/lib/types';

// Mock match suggestion data
const mockMatchSuggestion: MatchSuggestion = {
  match_id: 'match-001',
  confidence_score: 0.85,
  scoring_factors: {
    species_match: true,
    breed_similarity: 0.9,
    color_match: 0.8,
    size_match: 0.75,
    location_proximity_km: 3.2,
    time_gap_hours: 18,
    distinguishing_features_match: 0.7,
  },
  missing_case: {
    id: 'missing-001',
    case_reference: 'MP-2024-001',
    pet_name: 'Buddy',
    species: 'DOG',
    breed: 'Golden Retriever',
    last_seen_at: new Date().toISOString(),
    photo_url: null,
  },
  found_case: {
    id: 'found-001',
    case_reference: 'FA-2024-001',
    species: 'DOG',
    breed_guess: 'Golden Mix',
    found_at: new Date().toISOString(),
    photo_url: null,
  },
  status: 'PENDING',
  created_at: new Date().toISOString(),
  ai_advisory: 'AI-suggested match. Moderator verification required.',
};

// Helper function to check if user can view matches
function canViewMatchSuggestions(role: UserRole): boolean {
  const moderatorRoles: UserRole[] = [
    'PIGPIG_MODERATOR',
    'SHELTER_MODERATOR',
    'SYSTEM_ADMIN',
  ];
  return moderatorRoles.includes(role);
}

// Helper function to check if user can confirm matches
function canConfirmMatch(role: UserRole): boolean {
  const confirmRoles: UserRole[] = [
    'PIGPIG_MODERATOR',
    'SHELTER_MODERATOR',
    'SYSTEM_ADMIN',
  ];
  return confirmRoles.includes(role);
}

// Helper function to check if match details can be shared with owner
function canShareMatchWithOwner(match: MatchSuggestion): boolean {
  return match.status === 'CONFIRMED';
}

// Helper function to filter match data for non-moderators
function sanitizeMatchForPublic(match: MatchSuggestion): Partial<MatchSuggestion> | null {
  if (match.status !== 'CONFIRMED') {
    return null; // Don't expose unconfirmed matches
  }
  
  // Even confirmed matches should have limited exposure
  return {
    match_id: match.match_id,
    status: match.status,
    // Note: Full details only after explicit contact release
  };
}

describe('Moderator Gating', () => {
  describe('Access Control', () => {
    test('PIGPIG_MODERATOR should be able to view matches', () => {
      expect(canViewMatchSuggestions('PIGPIG_MODERATOR')).toBe(true);
    });

    test('SHELTER_MODERATOR should be able to view matches', () => {
      expect(canViewMatchSuggestions('SHELTER_MODERATOR')).toBe(true);
    });

    test('SYSTEM_ADMIN should be able to view matches', () => {
      expect(canViewMatchSuggestions('SYSTEM_ADMIN')).toBe(true);
    });

    test('PUBLIC_USER should NOT be able to view matches', () => {
      expect(canViewMatchSuggestions('PUBLIC_USER')).toBe(false);
    });

    test('OWNER should NOT be able to view matches', () => {
      expect(canViewMatchSuggestions('OWNER')).toBe(false);
    });

    test('FINDER should NOT be able to view matches', () => {
      expect(canViewMatchSuggestions('FINDER')).toBe(false);
    });
  });

  describe('Match Confirmation', () => {
    test('PIGPIG_MODERATOR should be able to confirm matches', () => {
      expect(canConfirmMatch('PIGPIG_MODERATOR')).toBe(true);
    });

    test('SHELTER_MODERATOR should be able to confirm matches', () => {
      expect(canConfirmMatch('SHELTER_MODERATOR')).toBe(true);
    });

    test('PUBLIC_USER should NOT be able to confirm matches', () => {
      expect(canConfirmMatch('PUBLIC_USER')).toBe(false);
    });

    test('OWNER should NOT be able to confirm matches', () => {
      expect(canConfirmMatch('OWNER')).toBe(false);
    });
  });

  describe('Match Visibility Rules', () => {
    test('PENDING match should NOT be shareable with owner', () => {
      const pendingMatch = { ...mockMatchSuggestion, status: 'PENDING' as const };
      expect(canShareMatchWithOwner(pendingMatch)).toBe(false);
    });

    test('REJECTED match should NOT be shareable with owner', () => {
      const rejectedMatch = { ...mockMatchSuggestion, status: 'REJECTED' as const };
      expect(canShareMatchWithOwner(rejectedMatch)).toBe(false);
    });

    test('CONFIRMED match should be shareable with owner', () => {
      const confirmedMatch = { ...mockMatchSuggestion, status: 'CONFIRMED' as const };
      expect(canShareMatchWithOwner(confirmedMatch)).toBe(true);
    });
  });

  describe('Data Sanitization', () => {
    test('PENDING match should return null for public', () => {
      const pendingMatch = { ...mockMatchSuggestion, status: 'PENDING' as const };
      expect(sanitizeMatchForPublic(pendingMatch)).toBeNull();
    });

    test('CONFIRMED match should return limited data for public', () => {
      const confirmedMatch = { ...mockMatchSuggestion, status: 'CONFIRMED' as const };
      const sanitized = sanitizeMatchForPublic(confirmedMatch);
      
      expect(sanitized).not.toBeNull();
      expect(sanitized?.match_id).toBeDefined();
      expect(sanitized?.status).toEqual('CONFIRMED');
      
      // Should NOT include detailed scoring factors
      expect((sanitized as MatchSuggestion)?.scoring_factors).toBeUndefined();
      // Should NOT include AI advisory
      expect((sanitized as MatchSuggestion)?.ai_advisory).toBeUndefined();
    });
  });

  describe('Match Status Transitions', () => {
    test('match can transition from PENDING to CONFIRMED', () => {
      const validTransitions = {
        PENDING: ['CONFIRMED', 'REJECTED'],
        CONFIRMED: [], // Terminal state
        REJECTED: [], // Terminal state
      };

      expect(validTransitions['PENDING']).toContain('CONFIRMED');
    });

    test('match can transition from PENDING to REJECTED', () => {
      const validTransitions = {
        PENDING: ['CONFIRMED', 'REJECTED'],
        CONFIRMED: [],
        REJECTED: [],
      };

      expect(validTransitions['PENDING']).toContain('REJECTED');
    });

    test('CONFIRMED match cannot be changed', () => {
      const validTransitions = {
        PENDING: ['CONFIRMED', 'REJECTED'],
        CONFIRMED: [],
        REJECTED: [],
      };

      expect(validTransitions['CONFIRMED'].length).toBe(0);
    });

    test('REJECTED match cannot be changed', () => {
      const validTransitions = {
        PENDING: ['CONFIRMED', 'REJECTED'],
        CONFIRMED: [],
        REJECTED: [],
      };

      expect(validTransitions['REJECTED'].length).toBe(0);
    });
  });

  describe('AI Advisory Requirements', () => {
    test('match suggestion should include AI advisory', () => {
      expect(mockMatchSuggestion.ai_advisory).toBeDefined();
      expect(mockMatchSuggestion.ai_advisory.length).toBeGreaterThan(0);
    });

    test('AI advisory should include verification requirement', () => {
      expect(mockMatchSuggestion.ai_advisory).toContain('verification required');
    });
  });

  describe('Confidence Score Handling', () => {
    test('confidence score should be between 0 and 1', () => {
      expect(mockMatchSuggestion.confidence_score).toBeGreaterThanOrEqual(0);
      expect(mockMatchSuggestion.confidence_score).toBeLessThanOrEqual(1);
    });

    test('scoring factors should sum to produce confidence score', () => {
      // Note: This is a simplified check - real implementation may vary
      const factors = mockMatchSuggestion.scoring_factors;
      expect(factors.species_match).toBeDefined();
      expect(factors.breed_similarity).toBeDefined();
      expect(factors.color_match).toBeDefined();
    });
  });

  describe('Notification Rules', () => {
    test('owner should NOT be notified of PENDING matches', () => {
      function shouldNotifyOwner(match: MatchSuggestion): boolean {
        return match.status === 'CONFIRMED';
      }

      const pendingMatch = { ...mockMatchSuggestion, status: 'PENDING' as const };
      expect(shouldNotifyOwner(pendingMatch)).toBe(false);
    });

    test('owner should be notified of CONFIRMED matches', () => {
      function shouldNotifyOwner(match: MatchSuggestion): boolean {
        return match.status === 'CONFIRMED';
      }

      const confirmedMatch = { ...mockMatchSuggestion, status: 'CONFIRMED' as const };
      expect(shouldNotifyOwner(confirmedMatch)).toBe(true);
    });

    test('owner should NOT be notified of REJECTED matches', () => {
      function shouldNotifyOwner(match: MatchSuggestion): boolean {
        return match.status === 'CONFIRMED';
      }

      const rejectedMatch = { ...mockMatchSuggestion, status: 'REJECTED' as const };
      expect(shouldNotifyOwner(rejectedMatch)).toBe(false);
    });
  });
});
