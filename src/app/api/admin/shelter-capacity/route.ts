import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const { data: shelters, error } = await supabase
      .from('partner_organizations')
      .select('*')
      .eq('organization_type', 'SHELTER');

    if (error) {
      console.error('Shelter capacity error:', error);
      return NextResponse.json({ shelters: [] });
    }

    // Transform to capacity format
    const capacityData = (shelters || []).map(s => {
      const dogPercent = s.max_dogs > 0 ? (s.current_dogs / s.max_dogs) * 100 : 0;
      const catPercent = s.max_cats > 0 ? (s.current_cats / s.max_cats) * 100 : 0;
      const maxPercent = Math.max(dogPercent, catPercent);
      
      let status: 'NORMAL' | 'ELEVATED' | 'CRITICAL' | 'OVERFLOW' = 'NORMAL';
      if (maxPercent >= 100) status = 'OVERFLOW';
      else if (maxPercent >= 95) status = 'CRITICAL';
      else if (maxPercent >= 85) status = 'ELEVATED';

      return {
        id: s.id,
        shelter_name: s.name,
        county: s.county,
        current_dogs: s.current_dogs || 0,
        max_dogs: s.max_dogs || 50,
        current_cats: s.current_cats || 0,
        max_cats: s.max_cats || 50,
        status,
        last_updated: s.capacity_updated_at || s.updated_at,
        contact_email: s.contact_email,
        contact_phone: s.contact_phone,
      };
    });

    return NextResponse.json({ shelters: capacityData });
  } catch (error) {
    console.error('Capacity API error:', error);
    return NextResponse.json({ shelters: [] });
  }
}
