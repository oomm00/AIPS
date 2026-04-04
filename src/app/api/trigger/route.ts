export const dynamic = 'force-dynamic';
/**
 * /api/trigger  –  Standalone Trigger Engine endpoint
 *
 * Independently callable for debugging. Creates its own simulation_event record
 * so FK constraints on trigger_runs and audit_logs are satisfied.
 */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { supabaseServer } from '@/lib/supabaseServer';
import { TriggerEngineInputSchema } from '@/lib/engineValidators';
import { runTriggerEngine } from '@/lib/triggerEngine';
import {
  createSimulationEvent,
  persistTriggerRun,
  writeAuditLog,
} from '@/lib/dbHelpers';
import type { TriggerOutput } from '@/lib/engineTypes';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const input = TriggerEngineInputSchema.parse(rawBody);

    // Resolve a valid simulation_id:
    // If the caller passes an existing simulation event UUID, use it.
    // Otherwise create a minimal solo event so FK constraints are satisfied.
    let simId: string = rawBody.simulationId ?? '';

    if (!simId) {
      // Find a dummy worker/zone from context if provided, else use seed IDs
      const workerId: string = rawBody.workerId ?? 'c5ae2517-c81b-426c-859a-14d9b62fef8b';
      const zoneId: string = rawBody.zoneId ?? 'ebb7cde9-79ad-4bc6-848e-f495e8ebcbee';

      simId = await createSimulationEvent({
        worker_id: workerId,
        zone_id: zoneId,
        event_type: input.type,
        payload_json: { intensity: input.intensity, standalone: true },
      });
    }

    const result: TriggerOutput = runTriggerEngine(input);

    const runId = await persistTriggerRun(simId, result);
    const auditId = await writeAuditLog({
      simulation_id: simId,
      engine_name: 'trigger',
      decision: result.decision,
      confidence: Number((1 - result.US).toFixed(4)),
      message: result.explanation,
      metadata_json: result.breakdown as Record<string, unknown>,
    });

    return NextResponse.json(
      {
        success: true,
        simulation_id: simId,
        run_id: runId,
        audit_id: auditId,
        data: result,
        explanation: result.explanation,
        breakdown: result.breakdown,
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
      .from('trigger_runs')
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
