export const dynamic = 'force-dynamic';
/**
 * /api/audit  –  Audit Trail Query
 *
 * GET:  Fetch audit log entries by simulation_id or worker_id.
 *       Supports pagination, sorted newest-first.
 *
 * Filtering by worker_id requires joining through simulation_events.
 * We use a Supabase subquery via a view-style query to achieve this cleanly.
 */
import { NextResponse } from 'next/server';

import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const simulation_id = searchParams.get('simulation_id');
    const worker_id = searchParams.get('worker_id');
    const engine_name = searchParams.get('engine_name');
    const page = Math.max(Number(searchParams.get('page') ?? '1'), 1);
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);
    const offset = (page - 1) * limit;

    if (!simulation_id && !worker_id) {
      return NextResponse.json(
        { success: false, error: 'Either simulation_id or worker_id query param is required' },
        { status: 400 }
      );
    }

    if (simulation_id) {
      // Direct filter – most common case (trace view)
      let query = supabaseServer
        .from('audit_logs')
        .select('id, simulation_id, engine_name, decision, confidence, message, metadata_json, created_at', { count: 'exact' })
        .eq('simulation_id', simulation_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (engine_name) {
        query = query.eq('engine_name', engine_name);
      }

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      return NextResponse.json(
        {
          success: true,
          data,
          pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
        },
        { status: 200 }
      );
    }

    // Filter by worker_id: first get all simulation_event IDs for this worker,
    // then pull audit logs for those IDs.
    const { data: events, error: eventsError } = await supabaseServer
      .from('simulation_events')
      .select('id')
      .eq('worker_id', worker_id as string);

    if (eventsError) throw new Error(eventsError.message);

    const simIds = (events ?? []).map((e) => e.id as string);

    if (simIds.length === 0) {
      return NextResponse.json(
        { success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } },
        { status: 200 }
      );
    }

    let query = supabaseServer
      .from('audit_logs')
      .select('id, simulation_id, engine_name, decision, confidence, message, metadata_json, created_at', { count: 'exact' })
      .in('simulation_id', simIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (engine_name) {
      query = query.eq('engine_name', engine_name);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json(
      {
        success: true,
        data,
        pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
