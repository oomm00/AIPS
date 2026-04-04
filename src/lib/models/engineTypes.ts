export interface Signal {
  value: number;
  weight: number;
  reliability: number;
  available: boolean;
}

export interface TriggerResult {
  TCS: number;
  US: number;
  decision: string;
  signals: Signal[];
}

export interface AttributionResult {
  expected_income: number;
  actual_income: number;
  raw_loss: number;
  causality_score: number;
  confidence_score: number;
  status: string;
}

export interface FraudResult {
  fraud_score: number;
  work_probability: number;
  payout_multiplier: number;
  risk_level: string;
}

export interface PremiumResult {
  BWE: number;
  premium: number;
  factors: Record<string, number | string>;
}

export interface PayoutResult {
  base_loss: number;
  fraud_adjusted: number;
  multiplier_applied: number;
  final_payout: number;
  breakdown: Record<string, number | string>;
}
