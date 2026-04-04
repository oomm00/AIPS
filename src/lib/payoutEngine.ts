import { PayoutOutput } from "./engineTypes";
import { PayoutEngineInputSchema } from "./engineValidators";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runPayoutEngine(inputRaw: any): PayoutOutput {
  const input = PayoutEngineInputSchema.parse(inputRaw);

  const fraud_penalty_factor = 0.7; // Standard scale deduction factor per spec

  // Core formula computation
  const base_loss = input.attributableLoss;
  const fraud_adjustment = 1 - (fraud_penalty_factor * input.fraudProbability);
  const payout_multiplier = input.payoutMultiplier;
  
  const incentive_delta = input.peakOverlap ? 100 : 0; // Hazard pay bonus
  
  // Supressing supplement if there's massive evidence they recovered earnings later
  const score_recovery_supplement = input.recoverySuppressionScore > 0.5 ? -50 : 25; 

  let final_payout = base_loss * fraud_adjustment * payout_multiplier + incentive_delta + score_recovery_supplement;
  
  // Floor at 0
  if (final_payout < 0) final_payout = 0;

  // Enforce Max Caps Policy Limit
  const cap_applied = final_payout > input.coverageCap;
  const capped_amount = cap_applied ? input.coverageCap : final_payout;

  return {
    status: cap_applied ? "CAPPED_PAYOUT" : "STANDARD_PAYOUT",
    base_loss: Number(base_loss.toFixed(2)),
    fraud_adjustment: Number(fraud_adjustment.toFixed(4)),
    multiplier: Number(payout_multiplier.toFixed(4)),
    incentive_delta: Number(incentive_delta.toFixed(2)),
    score_recovery_supplement: Number(score_recovery_supplement.toFixed(2)),
    final_payout: Number(capped_amount.toFixed(0)),
    cap_applied,
    capped_amount: Number(capped_amount.toFixed(0)),
    breakdown: {
      uncapped_theoretical_payout: final_payout,
      mathematical_flow: "base * fraud_adj * multiplier + incentive + recovery"
    },
    explanation: `Calculated payout chain completed. ${cap_applied ? 'Truncator bound applied keeping value at ₹' + capped_amount : 'Full computed payout authorized at ₹' + capped_amount}. Evaluated with a fraud adjustment scale of ${(fraud_adjustment*100).toFixed(0)}%.`
  };
}
