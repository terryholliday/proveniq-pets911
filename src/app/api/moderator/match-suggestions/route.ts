import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { MatchSuggestion } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/moderator/match-suggestions
 * Returns pending match suggestions for moderator review
 * 
 * Per CANONICAL_LAW.md: Match suggestions visible ONLY to moderators until confirmed
 * Per AI_GUARDRAILS.md: Must include disclosure "AI-suggested match. Moderator verification required."
 * 
 * TODO: Connect to Supabase backend + ML matching service
 * FAIL-CLOSED: Returns 503 if backend unavailable
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Verify moderator role from auth token
    // const token = request.headers.get('Authorization');

    const searchParams = request.nextUrl.searchParams;
    const county = searchParams.get('county');
    const minConfidence = searchParams.get('min_confidence');

    // TODO: Implement actual Supabase query with ML matching
    // For now, return stub data

    const suggestions: MatchSuggestion[] = [
      {
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
          last_seen_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          photo_url: null,
        },
        found_case: {
          id: 'found-001',
          case_reference: 'FA-2024-003',
          species: 'DOG',
          breed_guess: 'Golden/Lab Mix',
          found_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          photo_url: null,
        },
        status: 'PENDING',
        created_at: new Date().toISOString(),
        ai_advisory: 'AI-suggested match based on species, breed, color, and location proximity. Moderator verification required. Visual comparison recommended before confirmation.',
      },
    ];

    // Filter by confidence if specified
    const filtered = minConfidence
      ? suggestions.filter(s => s.confidence_score >= parseFloat(minConfidence))
      : suggestions;

    return NextResponse.json({
      success: true,
      data: {
        suggestions: filtered,
        count: filtered.length,
      },
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Match suggestions fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Match service temporarily unavailable. Please try again later.',
        },
        meta: {
          request_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }
}
