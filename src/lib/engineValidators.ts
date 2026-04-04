import { z } from "zod";

export const TriggerEngineInputSchema = z.object({
  eventId: z.string().uuid().optional(),
  type: z.enum(["Heavy Rain", "Internet Shutdown", "Zone Closure", "Heat Stress"]),
  zone: z.string(),
  intensity: z.number().min(0).max(100),
  signals: z.array(z.any()).optional(),
  workerActivity: z.object({
    gpsConfidence: z.number().min(0).max(1),
    recentOrderRatio: z.number().min(0).max(1)
  }).optional()
});

export const AttributionEngineInputSchema = z.object({
  triggerUs: z.number().min(0).max(1),
  peakOverlap: z.boolean(),
  hourlyRate: z.number().min(0),
  eventDurationHours: z.number().min(0).max(48),
  actualIncome: z.number().min(0),
  marketPulseScore: z.number().min(0).max(1).default(0.5),
  historicalIntentScore: z.number().min(0).max(1).default(0.8),
  recoveryEvidenceScore: z.number().min(0).max(1).default(0.0)
});

export const FraudEngineInputSchema = z.object({
  zone: z.string(),
  triggerTcs: z.number(),
  causalityScore: z.number(),
  historicalClaims: z.number().min(0),
  locationSpoofRisk: z.number().min(0).max(1).default(0),
  deviceIntegrity: z.number().min(0).max(1).default(1),
  normalizedTimeWorked: z.number().min(0).max(1).default(1),
  enrollmentTimingRisk: z.number().min(0).max(1).default(0)
});

export const PremiumEngineInputSchema = z.object({
  workerId: z.string().uuid(),
  zoneRiskIndex: z.number().min(0),
  workHistory: z.array(z.any()),
  recentClaimsAnomaly: z.number().min(0).max(1).default(0),
});

export const PayoutEngineInputSchema = z.object({
  attributableLoss: z.number().min(0),
  fraudProbability: z.number().min(0).max(1),
  payoutMultiplier: z.number().min(0).max(1),
  coverageCap: z.number().min(0),
  peakOverlap: z.boolean(),
  recoverySuppressionScore: z.number().min(0).max(1).default(0)
});

/**
 * Master Orchestrator input – drives /api/simulate-event
 */
export const SimulationInputSchema = z.object({
  workerId: z.string().uuid(),
  zoneId: z.string().uuid(),
  eventType: z.enum(["Heavy Rain", "Internet Shutdown", "Zone Closure", "Heat Stress"]),
  intensity: z.number().min(0).max(100),
  durationHours: z.number().min(0).max(48),
  peakOverlap: z.boolean().default(false),
  // Optional overrides for advanced callers
  marketPulseScore: z.number().min(0).max(1).default(0.5),
  historicalIntentScore: z.number().min(0).max(1).default(0.8),
  recoveryEvidenceScore: z.number().min(0).max(1).default(0.1),
  locationSpoofRisk: z.number().min(0).max(1).default(0.0),
  deviceIntegrity: z.number().min(0).max(1).default(0.95),
  enrollmentTimingRisk: z.number().min(0).max(1).default(0.05),
  historicalClaims: z.number().min(0).default(0),
});

/**
 * Worker create/upsert schema
 */
export const WorkerUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  platform: z.string().min(1),
  zone_id: z.string().uuid(),
  vehicle_type: z.string().min(1),
});
