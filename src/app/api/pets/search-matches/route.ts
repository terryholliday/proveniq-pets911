import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const species = searchParams.get('species');
    const county = searchParams.get('county');
    const color = searchParams.get('color');
    const status = searchParams.get('status') || 'lost';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!species || !county) {
      return NextResponse.json(
        { error: 'species and county are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Search for lost pets matching criteria
    let query = supabase
      .from('pet_cases')
      .select('*')
      .eq('species', species.toUpperCase())
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    // County matching - exact or nearby
    // For now, exact county match
    query = query.eq('county', county.toUpperCase());

    // Optional color filter
    if (color) {
      query = query.ilike('color', `%${color}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Search error:', error);
      // Return empty matches instead of error for graceful degradation
      return NextResponse.json({ matches: [], total: 0 });
    }

    // Calculate match scores based on available criteria
    const matches = (data || []).map((pet: any) => {
      let matchScore = 50; // Base score for same species + county

      // Boost score for color match
      if (color && pet.color?.toLowerCase().includes(color.toLowerCase())) {
        matchScore += 20;
      }

      // Boost for recent reports (within 7 days)
      const daysSinceLost = Math.floor(
        (Date.now() - new Date(pet.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLost <= 3) matchScore += 15;
      else if (daysSinceLost <= 7) matchScore += 10;
      else if (daysSinceLost <= 14) matchScore += 5;

      // Cap at 100
      matchScore = Math.min(matchScore, 100);

      return {
        id: pet.id,
        case_number: pet.case_number || `PM-${pet.id.slice(0, 8)}`,
        species: pet.species,
        breed: pet.breed,
        color: pet.color,
        name: pet.pet_name,
        description: pet.description,
        county: pet.county,
        last_seen_date: pet.last_seen_date || pet.created_at,
        photo_url: pet.photos?.[0] || null,
        match_score: matchScore,
        distance_miles: null, // Would require geocoding
      };
    });

    // Sort by match score
    matches.sort((a: any, b: any) => b.match_score - a.match_score);

    return NextResponse.json({
      matches,
      total: matches.length,
      search_params: { species, county, color, status },
    });

  } catch (error) {
    console.error('Match search error:', error);
    return NextResponse.json({ matches: [], total: 0, error: 'Search failed' });
  }
}
