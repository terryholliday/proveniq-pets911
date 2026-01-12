// Pet911 Certificate Verification API
// GET /api/training/verify/[hash] - Verify a certificate by hash

import { NextRequest, NextResponse } from 'next/server';
import { certificateService } from '@/lib/training/certificate-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;

    if (!hash || hash.length < 16) {
      return NextResponse.json(
        { valid: false, error: 'Invalid verification hash' },
        { status: 400 }
      );
    }

    const result = await certificateService.verifyCertificate(hash);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
