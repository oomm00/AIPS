import { AttributionOutput } from "./engineTypes";
import { AttributionEngineInputSchema } from "./engineValidators";
import { clamp } from "./scoringUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runAttributionEngine(inputRaw: any): AttributionOutput {
  const input = AttributionEngineInputSchema.parse(inputRaw);

  const opportunityFactor = input.peakOverlap ? 1.3 : 1.0;
  
  // Market pulse defines the general delivery velocity in the city
  const marketPulseMod = input.marketPulseScore; 

  const expected_income = input.hourlyRate * input.eventDurationHours * opportunityFactor * (0.5 + marketPulseMod * 0.5);
  const raw_loss = Math.max(0, expected_income - input.actualIncome);

  // 1. Causality Score computation
  let causality = 0;
  
  // Historical Intent matters heavily (Base 40%)
  causality += input.historicalIntentScore * 0.4;
  
  // Trigger Trust (Base 30%)
  causality += (1 - input.triggerUs) * 0.3;
  
  // Market Pulse alignment (Base 20%)
  causality += marketPulseMod * 0.2;
  
  // Recovery Evidence is positive-only reduction in causality (up to 30% reduction if they kept working normally after)
  const recoveryPenalty = input.recoveryEvidenceScore * 0.3;
  
  const causality_score = clamp(causality - recoveryPenalty, 0, 1);
  
  // 2. Confidence Score
  const confidence_score = clamp(1 - (input.triggerUs * 0.5), 0, 1);

  // 3. Status derivation
  let status = "NONE";
  if (causality_score > 0.8) status = "STRONG";
  else if (causality_score > 0.5) status = "PARTIAL";
  else if (causality_score > 0.2) status = "WEAK";

  // Low impact check
  if (expected_income < 100) {
     status = "WEAK"; // Skip ratio instability
  }

  const attributable_loss_amount = raw_loss * causality_score;
  const attributable_loss_ratio = expected_income > 0 ? attributable_loss_amount / expected_income : 0;

  return {
    status,
    expected_income: Number(expected_income.toFixed(2)),
    actual_income: Number(input.actualIncome.toFixed(2)),
    raw_loss: Number(raw_loss.toFixed(2)),
    attributable_loss_amount: Number(attributable_loss_amount.toFixed(2)),
    attributable_loss_ratio: Number(attributable_loss_ratio.toFixed(4)),
    causality_score: Number(causality_score.toFixed(4)),
    confidence_score: Number(confidence_score.toFixed(4)),
    breakdown_json: {
      opportunityFactor,
      marketPulseMod,
      historicalIntentWeight: input.historicalIntentScore * 0.4,
      recoveryPenalty
    },
    explanation: `Causality scored at ${causality_score.toFixed(2)} accounting for historical intent and recovery suppression yielding ${status} classification.`
  };
}
