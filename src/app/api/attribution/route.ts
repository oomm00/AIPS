export const dynamic = 'force-dynamic';
/**
 * /api/attribution  –  Standalone Attribution Engine endpoint
 *
 * Independently callable for debugging.
 * Expects `simulationId` in body (UUID of an existing simulation_event).
 * Falls back to creating a stub event if not provided.
 */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { supabaseServer } from '@/lib/supabaseServer';
import { AttributionEngineInputSchema } from '@/lib/engineValidators';
import { runAttributionEngine } from '@/lib/attributionEngine';
import {
  createSimulationEvent,
  persistAttributionRun,
  writeAuditLog,
} from '@/lib/dbHelpers';
import type { AttributionOutput } from '@/lib/engineTypes';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    let simId: string = rawBody.simulationId ?? '';

    if (!simId) {
      const workerId: string = rawBody.workerId ?? 'c5ae2517-c81b-426c-859a-14d9b62fef8b';
      const zoneId: string = rawBody.zoneId ?? 'ebb7cde9-79ad-4bc6-848e-f495e8ebcbee';
      simId = await createSimulationEvent({
        worker_id: workerId,
        zone_id: zoneId,
        event_type: 'attribution_standalone',
        payload_json: { standalone: true },
      });
    }

    const input = AttributionEngineInputSchema.parse(rawBody);
    const result: AttributionOutput = runAttributionEngine(input);

    const runId = await persistAttributionRun(simId, result);
    const auditId = await writeAuditLog({
      simulation_id: simId,
      engine_name: 'attribution',
      decision: result.status,
      confidence: result.confidence_score,
      message: result.explanation,
      metadata_json: result.breakdown_json as Record<string, unknown>,
    });

    return NextResponse.json(
      {
        success: true,
        simulation_id: simId,
        run_id: runId,
        audit_id: auditId,
        data: result,
        explanation: result.explanation,
        breakdown: result.breakdown_json,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const isZod = err instanceof ZodError;
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: isZod ? 'Validation failed' : message, details: isZod ? err.issues : undefined },
      { status: isZod ? 400 : 500 }
    );
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const simulation_id = searchParams.get('simulation_id');
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

    let query = supabaseServer
      .from('attribution_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (simulation_id) {
      query = query.eq('simulation_id', simulation_id);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
