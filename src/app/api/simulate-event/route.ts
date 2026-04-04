export const dynamic = 'force-dynamic';
/**
 * /api/simulate-event  –  Master Orchestrator
 *
 * Accepts a SimulationInput, loads DB context, runs all four engines in sequence,
 * persists every result and an audit log per step, and returns a SimulationTrace.
 *
 * No business logic lives here – only orchestration, persistence, and transport.
 */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { supabaseServer } from '@/lib/supabaseServer';
import { SimulationInputSchema } from '@/lib/engineValidators';
import { runTriggerEngine } from '@/lib/triggerEngine';
import { runAttributionEngine } from '@/lib/attributionEngine';
import { runFraudEngine } from '@/lib/fraudEngine';
import { runPayoutEngine } from '@/lib/payoutEngine';
import { median } from '@/lib/scoringUtils';
import {
  createSimulationEvent,
  persistTriggerRun,
  persistAttributionRun,
  persistFraudRun,
  persistPayoutRun,
  writeAuditLog,
} from '@/lib/dbHelpers';
import type { SimulationTrace } from '@/lib/engineTypes';

export async function POST(request: Request) {
  let simId: string | null = null;

  try {
    // ── 1. Parse & validate input ────────────────────────────────
    const rawBody = await request.json();
    const input = SimulationInputSchema.parse(rawBody);

    // ── 2. Load DB context ───────────────────────────────────────
    const [wRes, zRes, pRes, hRes] = await Promise.all([
      supabaseServer.from('workers').select('*').eq('id', input.workerId).single(),
      supabaseServer.from('zones').select('*').eq('id', input.zoneId).single(),
      supabaseServer
        .from('policies')
        .select('*')
        .eq('worker_id', input.workerId)
        .eq('status', 'active')
        .maybeSingle(),
      supabaseServer
        .from('work_history')
        .select('*')
        .eq('worker_id', input.workerId)
        .order('date', { ascending: false }),
    ]);

    if (wRes.error || !wRes.data) {
      return NextResponse.json(
        { error: 'Worker not found', details: wRes.error?.message },
        { status: 404 }
      );
    }
    if (zRes.error || !zRes.data) {
      return NextResponse.json(
        { error: 'Zone not found', details: zRes.error?.message },
        { status: 404 }
      );
    }

    const zone = zRes.data;
    const history = hRes.data ?? [];
    const policy = pRes.data ?? { coverage_limit: 3000 };

    // ── 3. Create root simulation_event record ───────────────────
    simId = await createSimulationEvent({
      worker_id: input.workerId,
      zone_id: input.zoneId,
      event_type: input.eventType,
      payload_json: {
        intensity: input.intensity,
        durationHours: input.durationHours,
        peakOverlap: input.peakOverlap,
      },
    });

    const auditRefs: string[] = [];

    // ── 4. TRIGGER ENGINE ────────────────────────────────────────
    const trigger = runTriggerEngine({
      eventId: simId,
      type: input.eventType,
      zone: zone.name,
      intensity: input.intensity,
      workerActivity: { gpsConfidence: 0.9, recentOrderRatio: 0.85 },
    });

    await persistTriggerRun(simId, trigger);
    const auditIdTrigger = await writeAuditLog({
      simulation_id: simId,
      engine_name: 'trigger',
      decision: trigger.decision,
      confidence: Number((1 - trigger.US).toFixed(4)),
      message: trigger.explanation,
      metadata_json: trigger.breakdown as Record<string, unknown>,
    });
    if (auditIdTrigger) auditRefs.push(auditIdTrigger);

    // ── 5. ATTRIBUTION ENGINE ────────────────────────────────────
    const earningsList = history.map((h) => Number(h.earnings));
    const medianDayEarnings = median(earningsList) || 800;
    const hourlyRate = medianDayEarnings / 8;

    const attribution = runAttributionEngine({
      triggerUs: trigger.US,
      peakOverlap: input.peakOverlap,
      hourlyRate,
      eventDurationHours: input.durationHours,
      actualIncome: 0,
      marketPulseScore: input.marketPulseScore,
      historicalIntentScore: input.historicalIntentScore,
      recoveryEvidenceScore: input.recoveryEvidenceScore,
    });

    await persistAttributionRun(simId, attribution);
    const auditIdAttrib = await writeAuditLog({
      simulation_id: simId,
      engine_name: 'attribution',
      decision: attribution.status,
      confidence: attribution.confidence_score,
      message: attribution.explanation,
      metadata_json: attribution.breakdown_json as Record<string, unknown>,
    });
    if (auditIdAttrib) auditRefs.push(auditIdAttrib);

    // ── 6. FRAUD ENGINE ──────────────────────────────────────────
    const fraud = runFraudEngine({
      zone: zone.name,
      triggerTcs: trigger.TCS,
      causalityScore: attribution.causality_score,
      historicalClaims: input.historicalClaims,
      locationSpoofRisk: input.locationSpoofRisk,
      deviceIntegrity: input.deviceIntegrity,
      normalizedTimeWorked: 1.0,
      enrollmentTimingRisk: input.enrollmentTimingRisk,
    });

    await persistFraudRun(simId, fraud);
    const auditIdFraud = await writeAuditLog({
      simulation_id: simId,
      engine_name: 'fraud',
      decision: fraud.status,
      confidence: fraud.work_probability,
      message: fraud.explanation,
      metadata_json: {
        payout_multiplier: fraud.payout_multiplier,
        ...fraud.signals_json,
      } as Record<string, unknown>,
    });
    if (auditIdFraud) auditRefs.push(auditIdFraud);

    // ── 7. PAYOUT ENGINE ─────────────────────────────────────────
    const payout = runPayoutEngine({
      attributableLoss: attribution.attributable_loss_amount,
      fraudProbability: Number((1 - fraud.work_probability).toFixed(4)),
      payoutMultiplier: fraud.payout_multiplier,
      coverageCap: policy.coverage_limit,
      peakOverlap: input.peakOverlap,
      recoverySuppressionScore: input.recoveryEvidenceScore,
    });

    await persistPayoutRun(simId, payout);
    const auditIdPayout = await writeAuditLog({
      simulation_id: simId,
      engine_name: 'payout',
      decision: payout.status,
      confidence: 0.99,
      message: payout.explanation,
      metadata_json: payout.breakdown as Record<string, unknown>,
    });
    if (auditIdPayout) auditRefs.push(auditIdPayout);

    // ── 8. Build & return SimulationTrace ────────────────────────
    const trace: SimulationTrace = {
      simulation_id: simId,
      trigger,
      attribution,
      fraud,
      payout,
      audit_refs: auditRefs,
    };

    return NextResponse.json(trace, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isZod = err instanceof ZodError;

    // If simId was created, write a failure audit log so the trace is complete
    if (simId) {
      await writeAuditLog({
        simulation_id: simId,
        engine_name: 'orchestrator',
        decision: 'FAILURE',
        confidence: 0,
        message: `Orchestration failed: ${message}`,
        metadata_json: { stage: 'unknown' },
      }).catch(() => {
        /* best-effort */
      });
    }

    console.error('[simulate-event] orchestration error:', message);
    return NextResponse.json(
      {
        error: isZod ? 'Validation failed' : 'Orchestration pipeline failed',
        details: isZod ? err.issues : message,
      },
      { status: isZod ? 400 : 500 }
    );
  }
}
