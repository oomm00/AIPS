import { PayoutResult } from "../../models/engineTypes";
import { PayoutEngineInputSchema } from "../../validators/engineValidators";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runPayoutEngine(inputRaw: any): PayoutResult {
  const input = PayoutEngineInputSchema.parse(inputRaw);
  
  // Applies the continuous fraud modifier instead of binary drop
  const fraudAdjusted = input.baseLoss * (1 - input.fraudProbability);
  
  // Tier scaling (Basic covers 80%, Standard covers 100%, Premium adds recovery supplement)
  let tierMultiplier = 1.0;
  if (input.tier === "Basic") tierMultiplier = 0.8;
  if (input.tier === "Premium") tierMultiplier = 1.2;
  
  let payout = fraudAdjusted * tierMultiplier;
  
  const incentiveDelta = input.peakOverlap ? 75 : 0; // Add ₹75 fixed hazard bonus if during peak
  payout += incentiveDelta;
  
  // Final clamping logic
  const finalPayout = Math.min(payout, input.coverageCap);

  return {
    base_loss: Number(input.baseLoss.toFixed(2)),
    fraud_adjusted: Number(fraudAdjusted.toFixed(2)),
    multiplier_applied: tierMultiplier,
    final_payout: Number(finalPayout.toFixed(0)),
    breakdown: {
      "Base Attributed Loss": input.baseLoss,
      "Fraud Penalty applied": -(input.baseLoss - fraudAdjusted).toFixed(2),
      "Tier Multiplier": `x${tierMultiplier}`,
      "Hazard Incentive": `+₹${incentiveDelta}`,
      "Capped at Coverage": `₹${input.coverageCap}`
    }
  };
}
