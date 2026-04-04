import { AttributionResult } from "../../models/engineTypes";
import { AttributionEngineInputSchema } from "../../validators/engineValidators";
import { clamp } from "../../utils/mathUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runAttributionEngine(inputRaw: any): AttributionResult {
  const input = AttributionEngineInputSchema.parse(inputRaw);
  
  const hourlyRate = input.defaultBwe / 60; // assumption: 60 hrs/week
  const expectedIncome = hourlyRate * input.eventDurationHours;
  
  const multiplier = input.peakOverlap ? 1.4 : 1.0;
  let rawLoss = expectedIncome * multiplier;
  
  const causalityScore = clamp(1 - (input.triggerUs * 0.5) - (input.historicalRiskFactor * 0.2), 0, 1);
  rawLoss = rawLoss * causalityScore;
  
  let status = "PENDING";
  if (causalityScore > 0.8) status = "STRONG_CAUSALITY";
  else if (causalityScore > 0.5) status = "WEAK_CAUSALITY";
  else status = "INSUFFICIENT_CAUSALITY";

  return {
    expected_income: Number(expectedIncome.toFixed(2)),
    actual_income: 0,
    raw_loss: Number(rawLoss.toFixed(2)),
    causality_score: Number(causalityScore.toFixed(4)),
    confidence_score: Number((1 - input.triggerUs).toFixed(4)),
    status
  };
}
