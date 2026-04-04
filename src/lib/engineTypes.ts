export interface Worker {
  id: string;
  name: string;
  platform: string;
  zone_id: string;
  vehicle_type: string;
  created_at?: string;
}

export interface Zone {
  id: string;
  name: string;
  city: string;
  zri: number;
  created_at?: string;
}

export interface WorkHistory {
  id: string;
  worker_id: string;
  date: string;
  hours_worked: number;
  orders_completed: number;
  earnings: number;
  time_block: string;
}

export interface Policy {
  id: string;
  worker_id: string;
  weekly_premium: number;
  coverage_limit: number;
  bwe: number;
  status: string;
  created_at?: string;
}

export interface TriggerOutput {
  decision: string;
  TCS: number;
  US: number;
  exposure_score: number;
  signals_json: Record<string, unknown>[];
  explanation: string;
  breakdown: Record<string, unknown>;
}

export interface AttributionOutput {
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
}

export interface FraudOutput {
  status: string;
  fraud_score: number;
  work_probability: number;
  payout_multiplier: number;
  signals_json: Record<string, unknown>;
  explanation: string;
}

export interface PremiumOutput {
  status: string;
  eligible: boolean;
  base_weekly_exposure: number;
  zone_multiplier: number;
  work_intensity_factor: number;
  time_exposure_factor: number;
  risk_adjustment: number;
  final_premium: number;
  explanation: string;
  breakdown: Record<string, unknown>;
}

export interface PayoutOutput {
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
}

export interface SimulationTrace {
  simulation_id: string;
  trigger: TriggerOutput;
  attribution: AttributionOutput;
  fraud: FraudOutput;
  payout: PayoutOutput;
  audit_refs: string[];
}
