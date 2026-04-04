import { FraudResult } from "../../models/engineTypes";
import { FraudEngineInputSchema } from "../../validators/engineValidators";
import { clamp } from "../../utils/mathUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runFraudEngine(inputRaw: any): FraudResult {
  const input = FraudEngineInputSchema.parse(inputRaw);
  
  // Work Probability relies on device integrity, trigger confidence, and preventing spoofing
  const baseProbability = input.deviceIntegrity * (1 - input.locationSpoofRisk);
  
  // High historic claims drop probability slightly
  const claimsPenalty = clamp(input.historicalClaims * 0.05, 0, 0.4);
  const workProbability = clamp(baseProbability - claimsPenalty, 0, 1);
  
  const fraudScore = 1 - workProbability;
  
  // Engine does NOT auto-deny. Scale multiplier purely on risk
  const payoutMultiplier = clamp(1 - fraudScore * 1.5, 0, 1);
  
  let riskLevel = "REVIEW";
  if (fraudScore > 0.7) riskLevel = "HIGH_RISK";
  else if (fraudScore < 0.2) riskLevel = "LOW_RISK";

  return {
    fraud_score: Number(fraudScore.toFixed(4)),
    work_probability: Number(workProbability.toFixed(4)),
    payout_multiplier: Number(payoutMultiplier.toFixed(4)),
    risk_level: riskLevel,
  };
}
