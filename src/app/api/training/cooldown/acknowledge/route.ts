import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// POST - Acknowledge a cooldown
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cooldownId } = body;

    if (!cooldownId) {
      return NextResponse.json(
        { error: 'Cooldown ID required' },
        { status: 400 }
      );
    }

    // Verify cooldown belongs to user
    const { data: cooldown, error: fetchError } = await supabase
      .from('volunteer_cooldown_events')
      .select('*')
      .eq('id', cooldownId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !cooldown) {
      return NextResponse.json(
        { error: 'Cooldown not found' },
        { status: 404 }
      );
    }

    // Update acknowledged_at
    const { error: updateError } = await supabase
      .from('volunteer_cooldown_events')
      .update({
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', cooldownId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Cooldown acknowledged',
    });
  } catch (error) {
    console.error('Failed to acknowledge cooldown:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge cooldown' },
      { status: 500 }
    );
  }
}
