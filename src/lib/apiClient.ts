/**
 * AIPS API Client
 * Typed fetch helpers for all API routes. Use only in client components.
 * Never imports anything from supabaseServer.
 */

// ─── Seed constants (used as defaults when no worker is registered) ───────────
export const SEED_WORKER_ID = 'c5ae2517-c81b-426c-859a-14d9b62fef8b';
export const SEED_ZONE_ID   = 'ebb7cde9-79ad-4bc6-848e-f495e8ebcbee';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiWorker {
  id: string;
  name: string;
  platform: string;
  zone_id: string;
  vehicle_type: string;
  created_at?: string;
  zones?: { id: string; name: string; city: string; zri: number };
}

export interface ApiPolicy {
  id: string;
  worker_id: string;
  weekly_premium: number;
  coverage_limit: number;
  bwe: number;
  status: string;
  created_at?: string;
}

export interface ApiPremiumResult {
  success: boolean;
  policy_id: string | null;
  eligibility: boolean;
  premium: number;
  coverage_limit: number;
  status: string;
  explanation: string;
  breakdown: Record<string, unknown>;
  data: {
    eligible: boolean;
    base_weekly_exposure: number;
    zone_multiplier: number;
    work_intensity_factor: number;
    time_exposure_factor: number;
    risk_adjustment: number;
    final_premium: number;
  };
}

export interface SimulationTrace {
  simulation_id: string;
  trigger: {
    decision: string;
    TCS: number;
    US: number;
    exposure_score: number;
    signals_json: unknown[];
    explanation: string;
    breakdown: Record<string, unknown>;
  };
  attribution: {
    status: string;
    expected_income: number;
    actual_income: number;
    raw_loss: number;
    attributable_loss_amount: number;
    attributable_loss_ratio: number;
    causality_score: number;
    confidence_score: number;
    breakdown_json: Record<string, unknown>;
    explanation: string;
  };
  fraud: {
    status: string;
    fraud_score: number;
    work_probability: number;
    payout_multiplier: number;
    signals_json: Record<string, unknown>;
    explanation: string;
  };
  payout: {
    status: string;
    base_loss: number;
    fraud_adjustment: number;
    multiplier: number;
    incentive_delta: number;
    score_recovery_supplement: number;
    final_payout: number;
    cap_applied: boolean;
    capped_amount: number;
    breakdown: Record<string, unknown>;
    explanation: string;
  };
  audit_refs: string[];
}

export interface AuditLogEntry {
  id: string;
  simulation_id: string;
  engine_name: string;
  decision: string;
  confidence: number;
  message: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditResponse {
  success: boolean;
  data: AuditLogEntry[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json() as T;
  return json;
}

// ─── Workers ──────────────────────────────────────────────────────────────────

export async function fetchWorkers(): Promise<ApiWorker[]> {
  const res = await apiFetch<{ success: boolean; data: ApiWorker[] }>('/api/workers');
  return res.data ?? [];
}

export async function createWorker(payload: {
  name: string;
  platform: string;
  zone_id: string;
  vehicle_type: string;
}): Promise<ApiWorker> {
  const res = await apiFetch<{ success: boolean; data: ApiWorker }>('/api/workers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.success) throw new Error('Worker creation failed');
  return res.data;
}

// ─── Policies ─────────────────────────────────────────────────────────────────

export async function fetchPolicies(worker_id: string): Promise<ApiPolicy[]> {
  const res = await apiFetch<{ success: boolean; data: ApiPolicy[] }>(
    `/api/policies?worker_id=${worker_id}`
  );
  return res.data ?? [];
}

export async function createPolicyQuote(payload: {
  worker_id: string;
  zone_risk_index: number;
  recent_claims_anomaly?: number;
  activate?: boolean;
}): Promise<ApiPremiumResult> {
  return apiFetch<ApiPremiumResult>('/api/policies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// ─── Premium ──────────────────────────────────────────────────────────────────

export async function fetchPremiumQuote(worker_id: string): Promise<ApiPremiumResult | null> {
  try {
    return apiFetch<ApiPremiumResult>(`/api/premium?worker_id=${worker_id}`);
  } catch {
    return null;
  }
}

// ─── Simulate Event ───────────────────────────────────────────────────────────

export interface SimulateInput {
  workerId: string;
  zoneId: string;
  eventType: 'Heavy Rain' | 'Internet Shutdown' | 'Zone Closure' | 'Heat Stress';
  intensity: number;
  durationHours: number;
  peakOverlap: boolean;
  marketPulseScore?: number;
  historicalIntentScore?: number;
  recoveryEvidenceScore?: number;
  locationSpoofRisk?: number;
  deviceIntegrity?: number;
  enrollmentTimingRisk?: number;
  historicalClaims?: number;
}

export async function runSimulation(input: SimulateInput): Promise<SimulationTrace> {
  const res = await fetch('/api/simulate-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json() as SimulationTrace & { error?: string };
  if (json.error) throw new Error(json.error);
  return json;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export async function fetchAuditLogs(params: {
  simulation_id?: string;
  worker_id?: string;
  engine_name?: string;
  page?: number;
  limit?: number;
}): Promise<AuditResponse> {
  const q = new URLSearchParams();
  if (params.simulation_id) q.set('simulation_id', params.simulation_id);
  if (params.worker_id) q.set('worker_id', params.worker_id);
  if (params.engine_name) q.set('engine_name', params.engine_name);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));

  return apiFetch<AuditResponse>(`/api/audit?${q.toString()}`);
}

// ─── Individual Engine Calls (for Engine Debug page) ─────────────────────────

export async function callTriggerEngine(payload: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>('/api/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function callAttributionEngine(payload: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>('/api/attribution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function callFraudEngine(payload: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>('/api/fraud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function callPayoutEngine(payload: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>('/api/payout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
