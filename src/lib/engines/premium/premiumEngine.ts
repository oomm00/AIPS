import { PremiumResult } from "../../models/engineTypes";
import { PremiumEngineInputSchema } from "../../validators/engineValidators";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runPremiumEngine(inputRaw: any): PremiumResult {
  const input = PremiumEngineInputSchema.parse(inputRaw);
  
  // Base coverage rate is ~4% of Base Weekly Earnings
  const baseRate = input.historicalBWE * 0.04;
  
  // ZRI modifies premium (Index 1.0 = normal, 1.2 = +20%)
  const zoneMod = (input.zoneRiskIndex - 1) * baseRate;
  
  // Highly concentrated peak hours increase risk
  const timeMod = input.peakHourShare * baseRate * 0.5;
  
  const finalPremium = baseRate + zoneMod + timeMod;

  return {
    BWE: input.historicalBWE,
    premium: Number(finalPremium.toFixed(0)),
    factors: {
      "Base Rate (4%)": `₹${baseRate.toFixed(0)}`,
      "Zone Modifier": zoneMod > 0 ? `+₹${zoneMod.toFixed(0)}` : `₹${zoneMod.toFixed(0)}`,
      "Time Exposure": `+₹${timeMod.toFixed(0)}`
    }
  };
}
