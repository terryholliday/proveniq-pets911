import { NextResponse } from 'next/server';
import type { CountyPack } from '@/lib/types';

/**
 * GET /api/county-packs
 * Returns list of available county packs
 * 
 * TODO: Connect to Supabase backend
 * FAIL-CLOSED: Returns 503 if backend unavailable
 */
export async function GET() {
  try {
    // TODO: Implement actual Supabase query
    // For now, return stub data
    
    const countyPacks: CountyPack[] = [
      {
        id: 'greenbrier-v1',
        county: 'GREENBRIER',
        display_name: 'Greenbrier County',
        timezone: 'America/New_York',
        version: 1,
        last_updated_at: new Date().toISOString(),
        bundle_url: '/api/county-packs/GREENBRIER/bundle',
        bundle_checksum: 'stub-checksum',
        bundle_size_kb: 50,
      },
      {
        id: 'kanawha-v1',
        county: 'KANAWHA',
        display_name: 'Kanawha County',
        timezone: 'America/New_York',
        version: 1,
        last_updated_at: new Date().toISOString(),
        bundle_url: '/api/county-packs/KANAWHA/bundle',
        bundle_checksum: 'stub-checksum',
        bundle_size_kb: 75,
      },
    ];

    return NextResponse.json({
      success: true,
      data: { county_packs: countyPacks },
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('County packs fetch error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'County pack service temporarily unavailable. Please try again later.',
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
