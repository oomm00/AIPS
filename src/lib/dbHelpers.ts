/**
 * Database persistence helpers for AIPS API layer.
 * All functions use the server-side Supabase client.
 * Never call these from client components.
 */
import { supabaseServer } from './supabaseServer';
import type {
  TriggerOutput,
  AttributionOutput,
  FraudOutput,
  PayoutOutput,
} from './engineTypes';

// ─────────────────────────────────────────────────────────────────
// Audit Log Helper
// ─────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  simulation_id: string;
  engine_name: string;
  decision: string;
  confidence: number;
  message: string;
  metadata_json?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<string | null> {
  const { data, error } = await supabaseServer
    .from('audit_logs')
    .insert(entry)
    .select('id')
    .single();
  if (error) {
    console.error('[audit_log] insert failed:', error.message);
    return null;
  }
  return data.id as string;
}

// ─────────────────────────────────────────────────────────────────
// Simulation Event
// ─────────────────────────────────────────────────────────────────

export interface SimulationEventPayload {
  worker_id: string;
  zone_id: string;
  event_type: string;
  payload_json: Record<string, unknown>;
}

export async function createSimulationEvent(
  payload: SimulationEventPayload
): Promise<string> {
  const { data, error } = await supabaseServer
    .from('simulation_events')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw new Error(`simulation_events insert failed: ${error.message}`);
  return data.id as string;
}

// ─────────────────────────────────────────────────────────────────
// Engine Run Persisters
// ─────────────────────────────────────────────────────────────────

export async function persistTriggerRun(
  simulation_id: string,
  result: TriggerOutput
): Promise<string> {
  const { data, error } = await supabaseServer
    .from('trigger_runs')
    .insert({
      simulation_id,
      TCS: result.TCS,
      US: result.US,
      decision: result.decision,
      exposure_score: result.exposure_score,
      signals_json: result.signals_json,
    })
    .select('id')
    .single();
  if (error) throw new Error(`trigger_runs insert failed: ${error.message}`);
  return data.id as string;
}

export async function persistAttributionRun(
  simulation_id: string,
  result: AttributionOutput
): Promise<string> {
  const { data, error } = await supabaseServer
    .from('attribution_runs')
    .insert({
      simulation_id,
      expected_income: result.expected_income,
      actual_income: result.actual_income,
      raw_loss: result.raw_loss,
      causality_score: result.causality_score,
      confidence_score: result.confidence_score,
      breakdown_json: result.breakdown_json,
    })
    .select('id')
    .single();
  if (error) throw new Error(`attribution_runs insert failed: ${error.message}`);
  return data.id as string;
}

export async function persistFraudRun(
  simulation_id: string,
  result: FraudOutput
): Promise<string> {
  const { data, error } = await supabaseServer
    .from('fraud_runs')
    .insert({
      simulation_id,
      fraud_score: result.fraud_score,
      work_probability: result.work_probability,
      signals_json: result.signals_json,
    })
    .select('id')
    .single();
  if (error) throw new Error(`fraud_runs insert failed: ${error.message}`);
  return data.id as string;
}

export async function persistPayoutRun(
  simulation_id: string,
  result: PayoutOutput
): Promise<string> {
  const { data, error } = await supabaseServer
    .from('payout_runs')
    .insert({
      simulation_id,
      base_loss: result.base_loss,
      fraud_adjustment: result.fraud_adjustment,
      multiplier: result.multiplier,
      incentive_delta: result.incentive_delta,
      final_payout: result.final_payout,
    })
    .select('id')
    .single();
  if (error) throw new Error(`payout_runs insert failed: ${error.message}`);
  return data.id as string;
}
