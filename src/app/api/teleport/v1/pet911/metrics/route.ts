import { NextRequest, NextResponse } from 'next/server';
import type { TeleportMetrics, TeleportAuthHeader } from '@/lib/teleport/pet911-teleport-schema';
import { validateTeleportAuth } from '@/lib/teleport/pet911-teleport-schema';

/**
 * GET /api/teleport/v1/pet911/metrics
 * 
 * Returns Pet911 performance metrics for Pet360 dashboard widget.
 * 
 * Query params:
 * - period: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' (default: MONTH)
 */
export async function GET(request: NextRequest) {
  // Validate Teleport auth
  const auth = validateTeleportAuth({
    'X-Teleport-Org-ID': request.headers.get('X-Teleport-Org-ID') || undefined,
    'X-Teleport-API-Key': request.headers.get('X-Teleport-API-Key') || undefined,
  } as Partial<TeleportAuthHeader>);

  if (!auth.valid) {
    return NextResponse.json(
      { error: auth.error, code: 'AUTH_FAILED' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get('period') || 'MONTH') as TeleportMetrics['period'];

  // TODO: Fetch actual metrics from database
  const metrics: TeleportMetrics = {
    organization_id: auth.organizationId!,
    period,
    alerts: {
      received: 24,
      acknowledged: 22,
      avg_response_minutes: 138, // 2.3 hours
    },
    outcomes: {
      total_intake: 18,
      reunifications: 12,
      reunification_rate: 0.67,
      avg_days_to_reunite: 3.2,
    },
    comparison: {
      county_avg_response_minutes: 408, // 6.8 hours
      county_avg_reunification_rate: 0.42,
      state_avg_reunification_rate: 0.38,
    },
  };

  return NextResponse.json({
    metrics,
    generated_at: new Date().toISOString(),
    next_refresh: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min cache
  });
}
