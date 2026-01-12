import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// GET - Fetch user's active cooldown
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active cooldown (ends_at > now and not overridden)
    const { data: cooldown, error } = await supabase
      .from('volunteer_cooldown_events')
      .select('*')
      .eq('user_id', userId)
      .gt('ends_at', new Date().toISOString())
      .is('overridden_by', null)
      .order('ends_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }

    return NextResponse.json({
      activeCooldown: cooldown || null,
    });
  } catch (error) {
    console.error('Failed to fetch cooldown:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cooldown status' },
      { status: 500 }
    );
  }
}
