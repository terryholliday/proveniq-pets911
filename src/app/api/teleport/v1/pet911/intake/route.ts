import { NextRequest, NextResponse } from 'next/server';
import type { TeleportIntakePayload, TeleportAuthHeader } from '@/lib/teleport/pet911-teleport-schema';
import { validateTeleportAuth } from '@/lib/teleport/pet911-teleport-schema';

/**
 * POST /api/teleport/v1/pet911/intake
 * 
 * Log animal intake from Pet360.
 * Links the intake to the original Pet911 alert and creates LifeLog event.
 */
export async function POST(request: NextRequest) {
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

  try {
    const payload: TeleportIntakePayload = await request.json();

    // Validate required fields
    if (!payload.alert_id) {
      return NextResponse.json(
        { error: 'alert_id is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!payload.animal?.microchip_scanned) {
      // Warn but don't block - Pet911 compliance pillar
      console.warn(`Intake without microchip scan: alert_id=${payload.alert_id}`);
    }

    // TODO: Implement actual database operations
    // 1. Update alert status to RESOLVED
    // 2. Create intake record
    // 3. Create LifeLog event for immutable audit trail
    // 4. Link to Pet911 case

    const intakeId = `INT-${Date.now()}`;
    const lifelogEventId = `LL-${Date.now()}`;

    return NextResponse.json({
      success: true,
      intake_id: intakeId,
      lifelog_event_id: lifelogEventId,
      alert_id: payload.alert_id,
      message: 'Intake logged successfully',
      next_steps: {
        stray_hold_expires: new Date(Date.now() + payload.disposition.stray_hold_days * 24 * 60 * 60 * 1000).toISOString(),
        reunification_url: `/api/teleport/v1/pet911/reunification`,
      },
    });

  } catch (error) {
    console.error('Teleport intake error:', error);
    return NextResponse.json(
      { error: 'Failed to process intake', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
