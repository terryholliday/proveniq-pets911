import { NextResponse } from 'next/server';
import { getPartnerGate } from '@/lib/access/authority';

/**
 * GET /api/partner/auth
 * 
 * Check if current user has partner access and return organization info
 */
export async function GET() {
  const gate = await getPartnerGate();

  if (!gate.allowed) {
    return NextResponse.json(
      { error: gate.reason, allowed: false },
      { status: gate.reason === 'UNAUTHENTICATED' ? 401 : 403 }
    );
  }

  return NextResponse.json({
    allowed: true,
    userId: gate.userId,
    organizationId: gate.organizationId,
    organizationName: gate.organizationName,
  });
}
