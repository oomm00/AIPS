import { FraudOutput } from "./engineTypes";
import { FraudEngineInputSchema } from "./engineValidators";
import { clamp } from "./scoringUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runFraudEngine(inputRaw: any): FraudOutput {
  const input = FraudEngineInputSchema.parse(inputRaw);

  // High quality activity assumes full normalization
  const activityQuality = (input.normalizedTimeWorked * 0.6) + 0.4;
  
  // Location integrity contrasts device signals vs spoofing algorithms
  const locationIntegrity = clamp(input.deviceIntegrity - input.locationSpoofRisk, 0, 1);

  let fraud_score = 0;
  
  // Location mismatch maps heavily to fraud
  fraud_score += (1 - locationIntegrity) * 0.5;
  
  // Enrollment timing attacks
  fraud_score += input.enrollmentTimingRisk * 0.2;
  
  // High historic claims velocity
  fraud_score += clamp(input.historicalClaims / 5, 0, 1) * 0.3;

  fraud_score = clamp(fraud_score, 0, 1);

  // Work probability during this historical window based on consistency (0.0 to 1.0)
  const work_probability = clamp(activityQuality * locationIntegrity * input.causalityScore, 0, 1);

  // Core requirement: "payout_multiplier = 0.15 + 0.85 * work_probability"
  const payout_multiplier = clamp(0.15 + (0.85 * work_probability), 0, 1);

  let status = "LOW_RISK";
  if (fraud_score >= 0.8) status = "CRITICAL_RISK";
  else if (fraud_score >= 0.5) status = "HIGH_RISK";
  else if (fraud_score >= 0.2) status = "MEDIUM_RISK";

  return {
    status,
    fraud_score: Number(fraud_score.toFixed(4)),
    work_probability: Number(work_probability.toFixed(4)),
    payout_multiplier: Number(payout_multiplier.toFixed(4)),
    signals_json: {
      locationIntegrity,
      activityQuality,
      enrollmentTimingRisk: input.enrollmentTimingRisk,
      claimsPenalty: input.historicalClaims
    },
    explanation: `Fraud algorithmic index computed at ${(fraud_score * 100).toFixed(1)}%. Calculated probability pricing multiplier set to ${payout_multiplier.toFixed(2)}x. Flagged as ${status}.`
  };
}
