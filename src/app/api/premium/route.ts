export const dynamic = 'force-dynamic';
/**
 * /api/premium  –  Premium Engine endpoint
 *
 * POST: Compute premium quote for a worker. If eligible, persist a policy record.
 * GET:  Retrieve a premium quote for an existing worker (uses work_history from DB).
 */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { supabaseServer } from '@/lib/supabaseServer';
import { PremiumEngineInputSchema } from '@/lib/engineValidators';
import { runPremiumEngine } from '@/lib/premiumEngine';
import type { PremiumOutput } from '@/lib/engineTypes';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const input = PremiumEngineInputSchema.parse(rawBody);
    const result: PremiumOutput = runPremiumEngine(input);

    let policyId: string | null = null;

    if (result.eligible) {
      // Persist as a quote_generated policy row
      const { data: policyData, error: policyError } = await supabaseServer
        .from('policies')
        .insert({
          worker_id: input.workerId,
          weekly_premium: result.final_premium,
          coverage_limit: Math.round(result.base_weekly_exposure * 15),
          bwe: result.base_weekly_exposure,
          status: 'quote_generated',
        })
        .select('id')
        .single();

      if (policyError) {
        console.error('[premium] policy insert failed:', policyError.message);
        // Non-fatal – still return the quote
      } else {
        policyId = policyData.id as string;
      }
    }

    return NextResponse.json(
      {
        success: true,
        policy_id: policyId,
        eligibility: result.eligible,
        premium: result.final_premium,
        status: result.status,
        explanation: result.explanation,
        breakdown: result.breakdown,
        data: result,
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

/**
 * GET /api/premium?worker_id=<uuid>
 * Loads work history and zone from DB then computes a live premium quote.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('worker_id');

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: 'worker_id query param is required' },
        { status: 400 }
      );
    }

    // Load worker + work history in parallel.
    // Zone is loaded separately to avoid relying on implicit DB relations.
    const [wRes, hRes] = await Promise.all([
      supabaseServer.from('workers').select('id, zone_id').eq('id', workerId).single(),
      supabaseServer
        .from('work_history')
        .select('*')
        .eq('worker_id', workerId)
        .order('date', { ascending: false }),
    ]);

    if (wRes.error) {
      return NextResponse.json(
        { success: false, error: `Failed to load worker: ${wRes.error.message}` },
        { status: 500 }
      );
    }

    if (!wRes.data) {
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      );
    }

    if (hRes.error) {
      return NextResponse.json(
        { success: false, error: `Failed to load work history: ${hRes.error.message}` },
        { status: 500 }
      );
    }

    let zri = 1.0;
    const zoneId = (wRes.data as { zone_id?: string | null }).zone_id;
    if (zoneId) {
      const { data: zoneData, error: zoneError } = await supabaseServer
        .from('zones')
        .select('zri, risk_index')
        .eq('id', zoneId)
        .maybeSingle();

      if (!zoneError && zoneData) {
        // Supports both schema variants: zones.zri and zones.risk_index
        const value = (zoneData as { zri?: number; risk_index?: number }).zri
          ?? (zoneData as { zri?: number; risk_index?: number }).risk_index
          ?? 1.0;
        zri = Number(value);
      }
    }

    const history = hRes.data ?? [];

    const result: PremiumOutput = runPremiumEngine({
      workerId,
      zoneRiskIndex: zri,
      workHistory: history,
      recentClaimsAnomaly: 0,
    });

    return NextResponse.json(
      {
        success: true,
        eligibility: result.eligible,
        premium: result.final_premium,
        status: result.status,
        explanation: result.explanation,
        breakdown: result.breakdown,
        data: result,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
