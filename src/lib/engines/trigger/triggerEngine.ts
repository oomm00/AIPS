import { TriggerResult, Signal } from "../../models/engineTypes";
import { TriggerEngineInputSchema } from "../../validators/engineValidators";
import { weightedSum, mean } from "../../utils/mathUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runTriggerEngine(inputRaw: any): TriggerResult {
  const input = TriggerEngineInputSchema.parse(inputRaw);
  
  // Default signals if none provided
  const signals: Signal[] = input.signals && input.signals.length > 0 ? input.signals : [
    { value: Math.min(input.intensity / 50, 1), weight: 0.6, reliability: 0.9, available: true },
    { value: input.type === 'Heavy Rain' ? 0.8 : 0.5, weight: 0.4, reliability: 0.7, available: true }
  ];
  
  const values = signals.map(s => s.value);
  const weights = signals.map(s => s.weight);
  const reliabilities = signals.map(s => s.reliability);
  
  const rawTcs = weightedSum(values, weights);
  const avgReliability = mean(reliabilities);
  const us = Math.max(0, 1 - avgReliability);
  
  const tcs = Math.max(0, rawTcs - (us * 0.2));

  let decision = "REVIEW";
  if (tcs >= 0.75 && us <= 0.2) decision = "AUTO_PAY";
  if (tcs < 0.3) decision = "REJECT";

  return {
    TCS: Number(tcs.toFixed(4)),
    US: Number(us.toFixed(4)),
    decision,
    signals,
  };
}
