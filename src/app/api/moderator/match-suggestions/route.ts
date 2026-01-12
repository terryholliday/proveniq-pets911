import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { MatchSuggestion } from '@/lib/types';
import { createServiceRoleClient, getSupabaseUser } from '@/lib/api/server-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/moderator/match-suggestions
 * Returns pending match suggestions for moderator review
 * 
 * Per CANONICAL_LAW.md: Match suggestions visible ONLY to moderators until confirmed
 * Per SAFETY_FIRST_POLICY.md: 50/50 human-AI moderation with mandatory human review for all matches
 * Per AI_GUARDRAILS.md: Must include disclosure "AI-suggested match. Moderator verification required."
 * 
 * UPDATED: All matches require human verification to prevent false hope and emotional tragedies
 * TODO: Connect to Supabase backend + ML matching service
 * FAIL-CLOSED: Returns 503 if backend unavailable
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const admin = createServiceRoleClient();
    const { data: actorVolunteer } = await admin
      .from('volunteers')
      .select('status, capabilities')
      .eq('user_id', user.id)
      .maybeSingle<{ status: string; capabilities: string[] }>();

    const isPrivileged =
      actorVolunteer?.status === 'ACTIVE' &&
      Array.isArray(actorVolunteer.capabilities) &&
      (actorVolunteer.capabilities.includes('SYSOP') || actorVolunteer.capabilities.includes('MODERATOR'));

    if (!isPrivileged) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient privileges' } },
        { status: 403 }
      );
    }

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
        ai_advisory: '⚠️ SAFETY NOTICE: AI-suggested match requiring human verification. This match has NOT been confirmed and may cause false hope if shared with pet owners before moderator review. Visual comparison of photos and verification of all details is REQUIRED before any owner contact.',
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
