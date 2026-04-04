export const dynamic = 'force-dynamic';
/**
 * /api/policies  –  Policy Management
 *
 * GET:  List policies for a worker (optionally filtered by status).
 * POST: Compute a premium quote via runPremiumEngine and persist the policy record.
 *       Returns eligibility, premium amount, explanation, and breakdown.
 */
import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { supabaseServer } from '@/lib/supabaseServer';
import { runPremiumEngine } from '@/lib/premiumEngine';
import type { PremiumOutput } from '@/lib/engineTypes';

const PolicyQuoteRequestSchema = z.object({
  worker_id: z.string().uuid(),
  zone_risk_index: z.number().min(0).default(1.0),
  recent_claims_anomaly: z.number().min(0).max(1).default(0),
  // Optionally activate the quote as an active policy
  activate: z.boolean().default(false),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const worker_id = searchParams.get('worker_id');
    const status = searchParams.get('status'); // e.g. 'active', 'quote_generated'
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

    if (!worker_id) {
      return NextResponse.json(
        { success: false, error: 'worker_id query param is required' },
        { status: 400 }
      );
    }

    let query = supabaseServer
      .from('policies')
      .select('*')
      .eq('worker_id', worker_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const req = PolicyQuoteRequestSchema.parse(rawBody);

    // Load work history from DB to feed into premium engine
    const { data: history, error: hError } = await supabaseServer
      .from('work_history')
      .select('*')
      .eq('worker_id', req.worker_id)
      .order('date', { ascending: false });

    if (hError) throw new Error(`Failed to load work history: ${hError.message}`);

    const result: PremiumOutput = runPremiumEngine({
      workerId: req.worker_id,
      zoneRiskIndex: req.zone_risk_index,
      workHistory: history ?? [],
      recentClaimsAnomaly: req.recent_claims_anomaly,
    });

    let policyId: string | null = null;

    if (result.eligible) {
      const policyStatus = req.activate ? 'active' : 'quote_generated';
      const { data: policyData, error: policyError } = await supabaseServer
        .from('policies')
        .insert({
          worker_id: req.worker_id,
          weekly_premium: result.final_premium,
          coverage_limit: Math.round(result.base_weekly_exposure * 15),
          bwe: result.base_weekly_exposure,
          status: policyStatus,
        })
        .select('id')
        .single();

      if (policyError) {
        console.error('[policies] insert failed:', policyError.message);
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
        coverage_limit: result.eligible ? Math.round(result.base_weekly_exposure * 15) : 0,
        status: result.status,
        explanation: result.explanation,
        breakdown: result.breakdown,
        data: result,
      },
      { status: result.eligible ? 201 : 200 }
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
