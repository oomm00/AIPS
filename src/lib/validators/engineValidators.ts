import { z } from "zod";

// Shared primitive validation blocks
export const SignalSchema = z.object({
  value: z.number(),
  weight: z.number(),
  reliability: z.number(),
  available: z.boolean(),
});

// Engine Specific Inputs
export const TriggerEngineInputSchema = z.object({
  eventId: z.string().uuid().optional(),
  type: z.enum(["Heavy Rain", "Internet Shutdown", "Zone Closure", "Heat Stress"]),
  zone: z.string(),
  intensity: z.number().min(0).max(100),
  peakOverlap: z.boolean(),
  signals: z.array(SignalSchema).optional(),
});

export const AttributionEngineInputSchema = z.object({
  triggerUs: z.number().min(0).max(1),
  peakOverlap: z.boolean(),
  defaultBwe: z.number().min(0),
  historicalRiskFactor: z.number(),
  eventDurationHours: z.number().min(0.5).max(24),
  timeOfDay: z.string().optional(),
});

export const FraudEngineInputSchema = z.object({
  zone: z.string(),
  triggerTcs: z.number(),
  causalityScore: z.number(),
  historicalClaims: z.number().optional().default(0),
  deviceIntegrity: z.number().optional().default(1),
  locationSpoofRisk: z.number().optional().default(0),
});

export const PayoutEngineInputSchema = z.object({
  baseLoss: z.number().min(0),
  fraudProbability: z.number().min(0).max(1),
  coverageCap: z.number().min(1),
  peakOverlap: z.boolean(),
  tier: z.enum(["Basic", "Standard", "Premium"]),
});

export const PremiumEngineInputSchema = z.object({
  workerId: z.string().uuid(),
  zoneRiskIndex: z.number().min(0),
  platform: z.string(),
  historicalBWE: z.number().min(0),
  peakHourShare: z.number().min(0).max(1).optional().default(0.2), // E.g., 20%
});
