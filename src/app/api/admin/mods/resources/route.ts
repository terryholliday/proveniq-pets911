import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/mods/resources
 * Fetch equipment, foster homes, and fund transactions
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Parse query params
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('type') || 'all';
    const county = searchParams.get('county');
    const status = searchParams.get('status');

    let equipment: any[] = [];
    let fosterHomes: any[] = [];
    let transactions: any[] = [];

    // Fetch equipment
    if (resourceType === 'all' || resourceType === 'equipment') {
      let query = adminDb
        .from('equipment')
        .select(`
          id,
          name,
          type,
          size,
          status,
          condition,
          location,
          county,
          checked_out_to,
          checked_out_at,
          expected_return_at,
          notes,
          created_at,
          volunteers:checked_out_to (
            id,
            display_name
          )
        `)
        .neq('status', 'retired')
        .order('type')
        .order('name');

      if (county) query = query.eq('county', county);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (!error && data) {
        equipment = data.map((e: any) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          size: e.size,
          status: e.status,
          condition: e.condition,
          location: e.location,
          county: e.county,
          checked_out_to: e.volunteers?.display_name || null,
          checked_out_to_id: e.checked_out_to,
          checked_out_at: e.checked_out_at,
          expected_return_at: e.expected_return_at,
          notes: e.notes,
        }));
      }
    }

    // Fetch foster homes
    if (resourceType === 'all' || resourceType === 'foster') {
      let query = adminDb
        .from('foster_homes')
        .select(`
          id,
          volunteer_id,
          capacity,
          current_animals,
          species_ok,
          sizes_ok,
          special_needs_ok,
          available,
          unavailable_until,
          county,
          city,
          total_placements,
          last_placement_at,
          notes,
          volunteers:volunteer_id (
            id,
            display_name,
            phone
          )
        `)
        .order('county')
        .order('available', { ascending: false });

      if (county) query = query.eq('county', county);

      const { data, error } = await query;
      if (!error && data) {
        fosterHomes = data.map((f: any) => ({
          id: f.id,
          name: f.volunteers?.display_name || 'Unknown',
          phone: f.volunteers?.phone,
          volunteer_id: f.volunteer_id,
          capacity: f.capacity,
          current_animals: f.current_animals,
          available_slots: f.capacity - f.current_animals,
          species_ok: f.species_ok || [],
          sizes_ok: f.sizes_ok || [],
          special_needs_ok: f.special_needs_ok,
          available: f.available,
          unavailable_until: f.unavailable_until,
          county: f.county,
          city: f.city,
          total_placements: f.total_placements,
          last_placement: f.last_placement_at,
          notes: f.notes,
        }));
      }
    }

    // Fetch fund transactions
    if (resourceType === 'all' || resourceType === 'fund') {
      let query = adminDb
        .from('emergency_fund_transactions')
        .select(`
          id,
          type,
          amount,
          description,
          category,
          status,
          requested_by,
          approved_by,
          approved_at,
          volunteer_id,
          case_id,
          receipt_url,
          notes,
          created_at,
          requester:requested_by (
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (!error && data) {
        transactions = data.map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          category: t.category,
          status: t.status,
          requested_by: t.requester?.email || 'System',
          approved_by: t.approved_by,
          approved_at: t.approved_at,
          receipt_url: t.receipt_url,
          date: t.created_at,
          notes: t.notes,
        }));
      }
    }

    // Calculate stats
    const equipmentStats = {
      total: equipment.length,
      available: equipment.filter(e => e.status === 'available').length,
      checked_out: equipment.filter(e => e.status === 'checked_out').length,
      maintenance: equipment.filter(e => e.status === 'maintenance').length,
    };

    const fosterStats = {
      total_homes: fosterHomes.length,
      available_homes: fosterHomes.filter(f => f.available && f.available_slots > 0).length,
      total_capacity: fosterHomes.reduce((sum, f) => sum + f.capacity, 0),
      current_animals: fosterHomes.reduce((sum, f) => sum + f.current_animals, 0),
      available_slots: fosterHomes.reduce((sum, f) => sum + (f.available ? f.available_slots : 0), 0),
    };

    const fundStats = {
      balance: transactions
        .filter(t => t.type === 'donation' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0) -
        transactions
        .filter(t => ['expense', 'reimbursement'].includes(t.type) && ['approved', 'completed'].includes(t.status))
        .reduce((sum, t) => sum + t.amount, 0),
      pending: transactions
        .filter(t => ['expense', 'reimbursement'].includes(t.type) && t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0),
      recent_transactions: transactions.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        equipment,
        fosterHomes,
        transactions,
        stats: {
          equipment: equipmentStats,
          foster: fosterStats,
          fund: fundStats,
        }
      }
    });

  } catch (error) {
    console.error('Resources API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/mods/resources
 * Create or update resources (equipment checkout, foster placement, fund transaction)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { action, resourceType, ...payload } = body;

    // Equipment checkout
    if (resourceType === 'equipment' && action === 'checkout') {
      const { equipment_id, volunteer_id, expected_return_at } = payload;
      
      // Update equipment status
      const { error: updateError } = await adminDb
        .from('equipment')
        .update({
          status: 'checked_out',
          checked_out_to: volunteer_id,
          checked_out_at: new Date().toISOString(),
          expected_return_at,
        })
        .eq('id', equipment_id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to checkout equipment' }, { status: 500 });
      }

      // Log to history
      await adminDb.from('equipment_checkout_history').insert({
        equipment_id,
        volunteer_id,
        checked_out_at: new Date().toISOString(),
        expected_return_at,
      });

      return NextResponse.json({ success: true, message: 'Equipment checked out' });
    }

    // Equipment return
    if (resourceType === 'equipment' && action === 'return') {
      const { equipment_id, condition_in, notes } = payload;
      
      // Get current checkout info
      const { data: equipment } = await adminDb
        .from('equipment')
        .select('checked_out_to, condition')
        .eq('id', equipment_id)
        .single();

      // Update equipment status
      const { error: updateError } = await adminDb
        .from('equipment')
        .update({
          status: 'available',
          checked_out_to: null,
          checked_out_at: null,
          expected_return_at: null,
          condition: condition_in || equipment?.condition,
        })
        .eq('id', equipment_id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to return equipment' }, { status: 500 });
      }

      // Update history record
      if (equipment?.checked_out_to) {
        await adminDb
          .from('equipment_checkout_history')
          .update({
            returned_at: new Date().toISOString(),
            condition_in,
            notes,
          })
          .eq('equipment_id', equipment_id)
          .eq('volunteer_id', equipment.checked_out_to)
          .is('returned_at', null);
      }

      return NextResponse.json({ success: true, message: 'Equipment returned' });
    }

    // Fund transaction
    if (resourceType === 'fund' && action === 'create') {
      const { type, amount, description, category, volunteer_id, case_id } = payload;
      
      const { data: transaction, error } = await adminDb
        .from('emergency_fund_transactions')
        .insert({
          type,
          amount,
          description,
          category,
          status: type === 'donation' ? 'completed' : 'pending',
          requested_by: user.id,
          volunteer_id,
          case_id,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
      }

      return NextResponse.json({ success: true, transaction });
    }

    // Fund transaction approval
    if (resourceType === 'fund' && action === 'approve') {
      const { transaction_id, approved } = payload;
      
      const { error } = await adminDb
        .from('emergency_fund_transactions')
        .update({
          status: approved ? 'approved' : 'denied',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', transaction_id);

      if (error) {
        return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: approved ? 'Approved' : 'Denied' });
    }

    return NextResponse.json({ error: 'Invalid action or resource type' }, { status: 400 });

  } catch (error) {
    console.error('Resources POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
