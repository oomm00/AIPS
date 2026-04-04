import { PremiumOutput } from "./engineTypes";
import { PremiumEngineInputSchema } from "./engineValidators";
import { median, calculateEarningsConcentration, clamp } from "./scoringUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runPremiumEngine(inputRaw: any): PremiumOutput {
  const input = PremiumEngineInputSchema.parse(inputRaw);
  const history = input.workHistory || [];

  // Eligibility Gate Constraints
  const weeksWorked = history.length;
  let eligible = true;
  let ineligibilityReason = "";

  if (weeksWorked < 8) {
     eligible = false;
     ineligibilityReason = "Requires minimum 8 weeks historical data.";
  }
  
  // Assuming each element in history represents a week structurally 
  // Normally we would parse dates, but we check if median is extremely low.
  const earningsList = history.map(h => typeof h === 'object' && h.earnings ? h.earnings : 0);
  const medianEarnings = median(earningsList);
  
  if (medianEarnings < 1500) {
      eligible = false;
      ineligibilityReason = "Fails minimum income continuity threshold.";
  }

  if (!eligible) {
      return {
        status: "INELIGIBLE",
        eligible: false,
        base_weekly_exposure: 0,
        zone_multiplier: 0,
        work_intensity_factor: 0,
        time_exposure_factor: 0,
        risk_adjustment: 0,
        final_premium: 0,
        explanation: `Eligibility Gate Failed: ${ineligibilityReason}`,
        breakdown: {}
      }
  }

  const baseRate = 0.05; // 5% baseline
  const BWE = medianEarnings;

  // Modifiers
  const k_zone = input.zoneRiskIndex; // 1.0 to 1.5 usually
  
  // Work intensity (assuming higher median earnings correlates to higher risk exposure)
  const WI = clamp(BWE / 5000, 0.8, 1.5); 
  
  // Time Exposure factor (earnings concentration in dangerous blocks)
  const TE = clamp(1 + calculateEarningsConcentration(history), 1.0, 2.0); 
  
  // Risk adjustment based on immediate past anomalies/claims
  const RA = clamp(1 + input.recentClaimsAnomaly, 1.0, 3.0);

  const final_premium = (BWE * baseRate) * k_zone * WI * TE * RA;

  return {
    status: "ACTIVE",
    eligible: true,
    base_weekly_exposure: Number(BWE.toFixed(2)),
    zone_multiplier: Number(k_zone.toFixed(4)),
    work_intensity_factor: Number(WI.toFixed(4)),
    time_exposure_factor: Number(TE.toFixed(4)),
    risk_adjustment: Number(RA.toFixed(4)),
    final_premium: Number(final_premium.toFixed(0)),
    breakdown: {
        raw_median_bwe: BWE,
        premium_equation: "Base(5%) * ZRI * WI * TE * RA"
    },
    explanation: `Worker qualifies for coverage. Base exposure evaluated at ₹${BWE.toFixed(0)} adjusting linearly across zone risk (${k_zone.toFixed(2)}x) and temporal volatility (${TE.toFixed(2)}x) securing a final weekly premium of ₹${final_premium.toFixed(0)}.`
  };
}
