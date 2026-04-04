import { TriggerOutput } from "./engineTypes";
import { TriggerEngineInputSchema } from "./engineValidators";
import { clamp, median, safeDivision } from "./scoringUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runTriggerEngine(inputRaw: any): TriggerOutput {
  const input = TriggerEngineInputSchema.parse(inputRaw);

  const signals = input.signals || [];
  
  // Normalization logic based on Type
  let baseTcs = 0;
  if (input.type === 'Heavy Rain') {
    // City threshold assumed at intensity 50mm=1.0 TCS
    baseTcs = clamp(input.intensity / 50, 0, 1);
  } else if (input.type === 'Internet Shutdown') {
    baseTcs = clamp(input.intensity / 100, 0, 1);
  } else {
    // Zone closure
    baseTcs = clamp(input.intensity / 80, 0, 1);
  }

  // Derive US (Uncertainty Score)
  // High variance in signals = higher uncertainty
  const rels = signals.map(s => s.reliability || 0.5);
  const medianRel = median(rels) || 0.8; // Assume 0.8 if no signals provided
  const US = clamp(1 - medianRel, 0, 1);

  // Derive TCS using reliability
  const TCS = clamp(baseTcs * (1 - (US * 0.3)), 0, 1);

  // Compute Exposure Score
  let exposure_score = 0.5; // default fallback
  if (input.workerActivity) {
    const { gpsConfidence, recentOrderRatio } = input.workerActivity;
    exposure_score = clamp((gpsConfidence * 0.6) + (recentOrderRatio * 0.4), 0, 1);
  }

  // Decision Matrix
  let decision = "MANUAL_REVIEW";
  if (TCS >= 0.85 && US <= 0.15) {
    decision = "AUTO_APPROVE";
  } else if (TCS >= 0.70 && US <= 0.30) {
    decision = "AUTO_APPROVE_LOW_CONFIDENCE";
  } else if (TCS < 0.3) {
    decision = "REJECT";
  }

  return {
    decision,
    TCS: Number(TCS.toFixed(4)),
    US: Number(US.toFixed(4)),
    exposure_score: Number(exposure_score.toFixed(4)),
    signals_json: signals,
    breakdown: {
      base_tcs: baseTcs,
      median_reliability: medianRel,
      missing_signal_penalty: Math.max(0, 3 - signals.length) * 0.05
    },
    explanation: `Calculated TCS of ${TCS.toFixed(2)} based on intensity ${input.intensity} for ${input.type}. Uncertainty evaluated at ${US.toFixed(2)} placing event in ${decision} matrix.`
  };
}
