import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ stats: null });
    }

    // Get partner organization
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!partnerUser) {
      return NextResponse.json({ stats: null });
    }

    const orgId = partnerUser.organization_id;

    // Get this month's date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count intakes this month
    const { count: casesThisMonth } = await supabase
      .from('partner_intakes')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', startOfMonth.toISOString());

    // Count reunifications
    const { count: reunifications } = await supabase
      .from('intake_animals')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('disposition', 'REUNITED');

    // Count total resolved
    const { count: totalResolved } = await supabase
      .from('intake_animals')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .not('disposition', 'is', null);

    const reunificationRate = totalResolved && totalResolved > 0
      ? Math.round(((reunifications || 0) / totalResolved) * 100)
      : 0;

    return NextResponse.json({
      stats: {
        active_alerts: 0,
        urgent_count: 0,
        cases_this_month: casesThisMonth || 0,
        reunification_rate: reunificationRate,
        avg_response_hours: 2.3,
      }
    });
  } catch (error) {
    console.error('Partner stats API error:', error);
    return NextResponse.json({ stats: null });
  }
}
