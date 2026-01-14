import { NextRequest, NextResponse } from 'next/server';
import type { TeleportAlert, TeleportAuthHeader } from '@/lib/teleport/mayday-teleport-schema';
import { validateTeleportAuth } from '@/lib/teleport/mayday-teleport-schema';

/**
 * GET /api/teleport/v1/mayday/alerts
 * 
 * Returns active alerts for the authenticated organization's service area.
 * Used by PROVENIQ ShelterOS to display alerts in their dashboard.
 * 
 * Query params:
 * - status: 'ACTIVE' | 'ACKNOWLEDGED' | 'ALL' (default: ACTIVE)
 * - since: ISO timestamp (default: last 24 hours)
 * - limit: number (default: 50, max: 100)
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
  const status = searchParams.get('status') || 'ACTIVE';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  // TODO: Fetch from database based on organization's service area
  // For now, return mock data
  const mockAlerts: TeleportAlert[] = [
    {
      alert_id: 'ALT-2026-0001',
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      tier: 'TIER_2_URGENT',
      code: 'CHARLIE',
      urgency: 'URGENT',
      animal: {
        species: 'CAT',
        description: 'Orange tabby, appears injured',
        color: 'Orange',
        size: 'MEDIUM',
        condition: 'INJURED_STABLE',
        photo_urls: [],
      },
      location: {
        county: 'GREENBRIER',
        city: 'Lewisburg',
        approximate_area: 'Downtown Lewisburg',
      },
      status: 'ACTIVE',
      actions: {
        can_acknowledge: true,
        can_resolve: false,
        acknowledge_url: `/api/teleport/v1/mayday/alerts/ALT-2026-0001/acknowledge`,
        resolve_url: `/api/teleport/v1/mayday/alerts/ALT-2026-0001/resolve`,
      },
    },
  ];

  return NextResponse.json({
    organization_id: auth.organizationId,
    alerts: mockAlerts,
    meta: {
      total: mockAlerts.length,
      limit,
      status_filter: status,
    },
  });
}
