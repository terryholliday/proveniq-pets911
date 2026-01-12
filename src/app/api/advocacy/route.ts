import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Fetch total contact count and stats
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get total from aggregated stats
    const { data: stats, error } = await supabase
      .from('advocacy_stats')
      .select('total_count, email_count, phone_count, resistbot_count, social_count, letter_count')
      .eq('stat_type', 'daily');
    
    if (error) {
      console.error('Error fetching advocacy stats:', error);
      // Return fallback count if table doesn't exist yet
      return NextResponse.json({ 
        total: 353, // Fallback seed value
        breakdown: {
          email: 169,
          phone: 116,
          resistbot: 39,
          social: 29,
          letter: 0
        },
        thisMonth: 353
      });
    }
    
    // Sum up all daily stats
    const totals = stats?.reduce((acc, day) => ({
      total: acc.total + (day.total_count || 0),
      email: acc.email + (day.email_count || 0),
      phone: acc.phone + (day.phone_count || 0),
      resistbot: acc.resistbot + (day.resistbot_count || 0),
      social: acc.social + (day.social_count || 0),
      letter: acc.letter + (day.letter_count || 0),
    }), { total: 0, email: 0, phone: 0, resistbot: 0, social: 0, letter: 0 });
    
    return NextResponse.json({
      total: totals?.total || 0,
      breakdown: {
        email: totals?.email || 0,
        phone: totals?.phone || 0,
        resistbot: totals?.resistbot || 0,
        social: totals?.social || 0,
        letter: totals?.letter || 0
      },
      thisMonth: totals?.total || 0
    });
  } catch (err) {
    console.error('Advocacy stats error:', err);
    return NextResponse.json({ total: 353, breakdown: {}, thisMonth: 353 });
  }
}

// POST - Log a new contact
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      contactType, 
      legislatorChamber, 
      legislatorDistrict, 
      legislatorParty,
      county,
      sessionId,
      referralSource 
    } = body;
    
    // Validate contact type
    const validTypes = ['email', 'phone', 'resistbot', 'social_twitter', 'social_facebook', 'letter'];
    if (!contactType || !validTypes.includes(contactType)) {
      return NextResponse.json(
        { error: 'Invalid contact type' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('advocacy_contacts')
      .insert({
        contact_type: contactType,
        legislator_chamber: legislatorChamber || null,
        legislator_district: legislatorDistrict || null,
        legislator_party: legislatorParty || null,
        county: county || null,
        session_id: sessionId || null,
        referral_source: referralSource || 'direct'
      });
    
    if (error) {
      console.error('Error logging advocacy contact:', error);
      // Don't fail the user action if logging fails
      return NextResponse.json({ success: true, logged: false });
    }
    
    return NextResponse.json({ success: true, logged: true });
  } catch (err) {
    console.error('Advocacy log error:', err);
    return NextResponse.json({ success: true, logged: false });
  }
}
