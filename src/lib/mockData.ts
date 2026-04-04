// ─── AIPS Mock Data Layer ────────────────────────────────────────
// Hardcoded data for demo. No API calls. No placeholders.

export interface WorkerProfile {
  id: string;
  name: string;
  age: number;
  partnerId: string;
  darkStore: string;
  zone: string;
  city: string;
  vehicleType: "petrol" | "ev" | "cycle";
  tenure: string;
  tier: "Basic" | "Standard" | "Premium";
  status: "active" | "suspended" | "pending";
  joinedDate: string;
}

export interface WeeklyEarning {
  week: string;
  gross: number;
  net: number;
  hours: number;
  orders: number;
  days: number;
}

export interface PolicyDetails {
  tier: "Basic" | "Standard" | "Premium";
  weeklyPremium: number;
  maxPayoutCap: number;
  bwe: number;
  coverageStatus: "Active" | "Suspended" | "Pending";
  activeSince: string;
  nextSettlement: string;
  rainThreshold: number;
  costRatio: number;
  zoneRiskIndex: number;
  workIntensity: number;
  timeExposure: number;
  riskAdjustment: number;
}

export interface TriggerEvent {
  id: string;
  type: "rain" | "shutdown" | "curfew" | "heat" | "aqi";
  date: string;
  time: string;
  duration: string;
  durationHours: number;
  indexValue: string;
  indexUnit: string;
  tcs: number;
  us: number;
  exposureScore: number;
  causalityScore: number;
  fraudScore: number;
  payoutAmount: number | null;
  status: "paid" | "pending" | "rejected" | "review";
  statusReason?: string;
  peakOverlap: boolean;
  zone: string;
}

export interface EarningsHeatmap {
  slot: string;
  share: number;
  avgOrders: number;
}

export interface SimulationResult {
  timestamp: string;
  stage: string;
  message: string;
  type: "info" | "data" | "pass" | "fail" | "result";
}

// ─── Worker Profile ──────────────────────────────────────────────

export const workerProfile: WorkerProfile = {
  id: "wkr_0x8a2f91",
  name: "Om Sati",
  age: 20,
  partnerId: "WP-882193",
  darkStore: "HSR Layout Dark Store",
  zone: "HSR-BLR-07",
  city: "Bengaluru",
  vehicleType: "petrol",
  tenure: "14 months",
  tier: "Standard",
  status: "active",
  joinedDate: "2025-02-11",
};

// ─── 8-Week Earnings History ─────────────────────────────────────

export const weeklyEarnings: WeeklyEarning[] = [
  { week: "W08 · Feb 10", gross: 6820, net: 4774, hours: 58, orders: 168, days: 6 },
  { week: "W07 · Feb 17", gross: 7150, net: 5005, hours: 62, orders: 179, days: 6 },
  { week: "W06 · Feb 24", gross: 6540, net: 4578, hours: 55, orders: 158, days: 5 },
  { week: "W05 · Mar 03", gross: 7300, net: 5110, hours: 64, orders: 185, days: 6 },
  { week: "W04 · Mar 10", gross: 6900, net: 4830, hours: 59, orders: 171, days: 6 },
  { week: "W03 · Mar 17", gross: 7480, net: 5236, hours: 66, orders: 192, days: 6 },
  { week: "W02 · Mar 24", gross: 6680, net: 4676, hours: 56, orders: 162, days: 5 },
  { week: "W01 · Mar 31", gross: 7020, net: 4914, hours: 61, orders: 175, days: 6 },
];

// ─── Active Policy ───────────────────────────────────────────────

export const policyDetails: PolicyDetails = {
  tier: "Standard",
  weeklyPremium: 165,
  maxPayoutCap: 2958, // 60% of BWE
  bwe: 4930, // median of 8 weeks net
  coverageStatus: "Active",
  activeSince: "2025-04-14",
  nextSettlement: "2026-04-11",
  rainThreshold: 6, // mm/hr for Bengaluru
  costRatio: 0.30,
  zoneRiskIndex: 1.18,
  workIntensity: 1.05,
  timeExposure: 1.12,
  riskAdjustment: 1.0,
};

// ─── Trigger Event History ───────────────────────────────────────

export const triggerHistory: TriggerEvent[] = [
  {
    id: "evt_rain_0402",
    type: "rain",
    date: "2026-04-02",
    time: "19:12",
    duration: "3h 40m",
    durationHours: 3.67,
    indexValue: "7.2",
    indexUnit: "mm/hr",
    tcs: 0.88,
    us: 0.14,
    exposureScore: 0.82,
    causalityScore: 0.79,
    fraudScore: 0.08,
    payoutAmount: 636,
    status: "paid",
    peakOverlap: true,
    zone: "HSR-BLR-07",
  },
  {
    id: "evt_shut_0318",
    type: "shutdown",
    date: "2026-03-18",
    time: "14:30",
    duration: "6h 15m",
    durationHours: 6.25,
    indexValue: "SFLC",
    indexUnit: "confirmed",
    tcs: 0.91,
    us: 0.09,
    exposureScore: 0.76,
    causalityScore: 0.81,
    fraudScore: 0.05,
    payoutAmount: 487,
    status: "paid",
    peakOverlap: false,
    zone: "HSR-BLR-07",
  },
  {
    id: "evt_heat_0312",
    type: "heat",
    date: "2026-03-12",
    time: "11:00",
    duration: "4h 30m",
    durationHours: 4.5,
    indexValue: "43.2",
    indexUnit: "°C HI",
    tcs: 0.62,
    us: 0.38,
    exposureScore: 0.71,
    causalityScore: 0.44,
    fraudScore: 0.12,
    payoutAmount: null,
    status: "rejected",
    statusReason: "Heat not standalone trigger in MVP. Modifier only.",
    peakOverlap: false,
    zone: "HSR-BLR-07",
  },
  {
    id: "evt_rain_0228",
    type: "rain",
    date: "2026-02-28",
    time: "20:45",
    duration: "2h 10m",
    durationHours: 2.17,
    indexValue: "6.8",
    indexUnit: "mm/hr",
    tcs: 0.76,
    us: 0.22,
    exposureScore: 0.88,
    causalityScore: 0.72,
    fraudScore: 0.06,
    payoutAmount: 410,
    status: "paid",
    peakOverlap: true,
    zone: "HSR-BLR-07",
  },
];

// ─── Personal Earnings Heatmap ───────────────────────────────────

export const earningsHeatmap: EarningsHeatmap[] = [
  { slot: "6–9 AM", share: 0.04, avgOrders: 2.1 },
  { slot: "9 AM–12 PM", share: 0.14, avgOrders: 5.8 },
  { slot: "12–3 PM", share: 0.18, avgOrders: 7.2 },
  { slot: "3–6 PM", share: 0.16, avgOrders: 6.4 },
  { slot: "6–9 PM", share: 0.32, avgOrders: 12.8 },
  { slot: "9 PM–12 AM", share: 0.16, avgOrders: 6.3 },
];

// ─── System Status ───────────────────────────────────────────────

export const systemStatus = {
  triggerEngine: "operational" as const,
  attributionEngine: "operational" as const,
  fraudEngine: "operational" as const,
  payoutEngine: "operational" as const,
  iotSensors: 47,
  iotOnline: 44,
  lastSync: "2026-04-04T16:42:00+05:30",
  activePolicies: 12847,
  pendingReviews: 23,
  todayPayouts: 156,
  todayPayoutVolume: 89420,
};

// ─── Simulation Sequences ────────────────────────────────────────

export const rainSimulationSteps: SimulationResult[] = [
  { timestamp: "T+0.0s", stage: "INGEST", message: "IoT sensor HSR-07 reading: 7.4mm/hr (raw)", type: "data" },
  { timestamp: "T+0.2s", stage: "INGEST", message: "OpenWeather One Call: 6.9mm/hr @ 12.9172°N, 77.6369°E", type: "data" },
  { timestamp: "T+0.3s", stage: "INGEST", message: "Neighbor zone HSR-06: 5.8mm/hr | HSR-08: 6.2mm/hr", type: "data" },
  { timestamp: "T+0.5s", stage: "NORMALIZE", message: "Rain normalized → IoT: 1.00, OW: 0.90, Neighbor: 0.70", type: "info" },
  { timestamp: "T+0.6s", stage: "NORMALIZE", message: "Temporal smoothing applied (30min window). Peak retained.", type: "info" },
  { timestamp: "T+0.8s", stage: "RELIABILITY", message: "IoT freshness: 1.0 (2min ago) | OW freshness: 0.85 (8min ago)", type: "info" },
  { timestamp: "T+0.9s", stage: "RELIABILITY", message: "Consistency check: IoT-OW delta within bounds. All sources agree.", type: "pass" },
  { timestamp: "T+1.1s", stage: "TCS", message: "Computing trigger confidence...", type: "info" },
  { timestamp: "T+1.2s", stage: "TCS", message: "TCS = Σ(Wi×Si×Ri) / Σ(Wi×Ri) = 0.88", type: "result" },
  { timestamp: "T+1.3s", stage: "UNCERTAINTY", message: "US = 0.14 | missing_ratio: 0.0, variance: 0.02, avg_reliability: 0.82", type: "result" },
  { timestamp: "T+1.5s", stage: "DECISION", message: "TCS 0.88 > 0.75 AND US 0.14 < 0.30 → AUTO_APPROVE", type: "pass" },
  { timestamp: "T+1.7s", stage: "EXPOSURE", message: `Worker ${workerProfile.name} (${workerProfile.partnerId}): activity=0.85, gps=0.91, orders=0.78`, type: "data" },
  { timestamp: "T+1.8s", stage: "EXPOSURE", message: "ExposureScore = 0.40(0.85) + 0.30(0.91) + 0.30(0.78) = 0.85", type: "result" },
  { timestamp: "T+2.0s", stage: "ATTRIBUTION", message: "Expected income (19:00–22:40): ₹486 | Actual: ₹92", type: "data" },
  { timestamp: "T+2.1s", stage: "ATTRIBUTION", message: "Raw loss: ₹394 | Causality score: 0.82 → STRONG", type: "result" },
  { timestamp: "T+2.3s", stage: "FRAUD", message: "FraudScore = 0.08 (LOW RISK) | WPC multiplier = 0.94", type: "pass" },
  { timestamp: "T+2.5s", stage: "PAYOUT", message: "Peak overlap detected (19:12 in 19:00–23:00). Incentive Delta: +₹150", type: "info" },
  { timestamp: "T+2.6s", stage: "PAYOUT", message: "payout = ₹394 × (1 - 0.70×0.08) × 0.94 + ₹150 = ₹636", type: "result" },
  { timestamp: "T+2.8s", stage: "SETTLE", message: "Razorpay sandbox → UPI: om.sati@upi | Amount: ₹636", type: "pass" },
  { timestamp: "T+3.0s", stage: "AUDIT", message: "Evidence bundle written. Event ID: evt_rain_sim_0404. Immutable.", type: "pass" },
];

export const stressTestSteps: SimulationResult[] = [
  { timestamp: "T+0.0s", stage: "INIT", message: "Stress test: 500 concurrent workers across 12 zones", type: "info" },
  { timestamp: "T+0.3s", stage: "TRIGGER", message: "Injecting rain event: 8.1mm/hr across BLR zones 05–12", type: "data" },
  { timestamp: "T+0.5s", stage: "TRIGGER", message: "IoT sensors reporting: 8/8 online. All readings consistent.", type: "pass" },
  { timestamp: "T+0.8s", stage: "TRIGGER", message: "TCS computed for 500 workers. Range: 0.72–0.91. Avg: 0.84", type: "result" },
  { timestamp: "T+1.0s", stage: "EXPOSURE", message: "Exposure scoring: 412 workers > 0.70, 67 partial, 21 manual review", type: "data" },
  { timestamp: "T+1.3s", stage: "ATTRIBUTION", message: "Attribution batch: 412 STRONG, 49 PARTIAL, 18 WEAK, 21 NONE", type: "result" },
  { timestamp: "T+1.5s", stage: "FRAUD", message: "Fraud sweep: 487 LOW, 11 MEDIUM, 2 HIGH → routed to review", type: "data" },
  { timestamp: "T+1.8s", stage: "FRAUD", message: "Zone coordination check: no anomalous sync patterns detected", type: "pass" },
  { timestamp: "T+2.0s", stage: "PAYOUT", message: "Batch payout: 461 approved, 23 review, 16 below threshold", type: "result" },
  { timestamp: "T+2.3s", stage: "PAYOUT", message: "Total disbursement: ₹2,84,620 | Avg per worker: ₹617", type: "result" },
  { timestamp: "T+2.5s", stage: "RESERVE", message: "Reserve impact: 14.2% of weekly pool. Within tolerance.", type: "pass" },
  { timestamp: "T+2.8s", stage: "PERF", message: "Pipeline latency: p50=1.2s, p95=2.8s, p99=4.1s. SLA met.", type: "pass" },
  { timestamp: "T+3.0s", stage: "AUDIT", message: "500 audit records written. 0 data gaps. Stress test COMPLETE.", type: "pass" },
];

// ─── Premium Pricing Factors (Why This Price?) ──────────────────

export interface PricingFactor {
  label: string;
  impact: string;
  direction: "up" | "down" | "neutral";
  detail: string;
  signal: string;
}

export const premiumPricingFactors: PricingFactor[] = [
  {
    label: "Zone Risk Index",
    impact: "+18%",
    direction: "up",
    detail: "HSR Layout has 1.8× rain frequency vs city median. 14 disruption events in last 90 days.",
    signal: "k_zone = 1.18",
  },
  {
    label: "Evening Earnings Concentration",
    impact: "+22%",
    direction: "up",
    detail: "32% of weekly income earned in the 6–9 PM block. A single peak-window disruption wipes a disproportionate share.",
    signal: "TE = 1.12 (top-block share / 0.5)",
  },
  {
    label: "Stable Work Pattern",
    impact: "-10%",
    direction: "down",
    detail: "Worked 6 of 8 weeks consistently. Low earnings variance (CV = 0.06). Reliable baseline.",
    signal: "WI = 1.05 (within benchmark)",
  },
  {
    label: "Clean Claims History",
    impact: "-6%",
    direction: "down",
    detail: "No fraudulent claims. 3 legitimate payouts in 8 weeks, all below zone avg claim rate. RA held at 1.0.",
    signal: "RA = 1.00 (no loading)",
  },
  {
    label: "Vehicle Cost Ratio",
    impact: "neutral",
    direction: "neutral",
    detail: "Petrol two-wheeler: 30% of gross deducted for fuel and maintenance before BWE calculation.",
    signal: "cost_ratio = 0.30",
  },
];

// ─── Risk Intelligence ──────────────────────────────────────────

export interface RiskSignal {
  label: string;
  value: string;
  level: "low" | "medium" | "high" | "critical";
  confidence: number;
  source: string;
}

export const riskIntelligence: RiskSignal[] = [
  {
    label: "Zone Disruption Risk",
    value: "HIGH",
    level: "high",
    confidence: 0.84,
    source: "Historical zone pattern + seasonal model",
  },
  {
    label: "Rain Probability (24h)",
    value: "78%",
    level: "high",
    confidence: 0.72,
    source: "OpenWeather forecast + IoT trend",
  },
  {
    label: "Expected Income Impact",
    value: "₹380–520 at risk",
    level: "high",
    confidence: 0.68,
    source: "Attribution model × forecast TCS",
  },
  {
    label: "IoT Sensor Health",
    value: "44/47 online",
    level: "low",
    confidence: 0.94,
    source: "Watchdog heartbeat (< 2min)",
  },
];

export const riskSuggestedAction = {
  text: "Increase coverage to Premium tier for ₹12/week more",
  reason: "Monsoon onset detected. Zone HSR-07 historical loss rate increases 2.4× in April–June.",
  additionalCost: 12,
  additionalCoverage: 986,
};

// ─── Last Payout Breakdown ──────────────────────────────────────

export interface PayoutStep {
  label: string;
  value: number;
  formula?: string;
  type: "base" | "deduction" | "multiplier" | "addition" | "final";
}

export const lastPayoutBreakdown: PayoutStep[] = [
  {
    label: "Attributable Loss",
    value: 394,
    formula: "ExpectedIncome(₹486) - ActualIncome(₹92)",
    type: "base",
  },
  {
    label: "Fraud Score Adjustment",
    value: -22,
    formula: "× (1 - 0.70 × 0.08) = ×0.944",
    type: "deduction",
  },
  {
    label: "Work Probability Multiplier",
    value: -24,
    formula: "× WPC(0.94) for 19:00–22:40 window",
    type: "multiplier",
  },
  {
    label: "Loss After Adjustments",
    value: 348,
    formula: "₹394 × 0.944 × 0.94",
    type: "base",
  },
  {
    label: "Peak-Hour Bonus (Incentive Delta)",
    value: 150,
    formula: "Event in 19:00–23:00 → milestone compensation",
    type: "addition",
  },
  {
    label: "Score Recovery Supplement",
    value: 138,
    formula: "Acceptance rate drop: -8.2% post-event × 5-day recovery",
    type: "addition",
  },
  {
    label: "Final Payout",
    value: 636,
    formula: "₹348 + ₹150 + ₹138 = ₹636 (within 60% BWE cap)",
    type: "final",
  },
];

// ─── Worker Risk Scores ─────────────────────────────────────────

export const workerRiskScores = {
  fraudRisk: {
    score: 0.08,
    tier: "LOW" as const,
    signals: {
      location: 0.06,
      activity: 0.09,
      claimFreq: 0.12,
      enrollment: 0.0,
      baseline: 0.04,
      crossPlatform: 0.0,
      zoneCoord: 0.0,
      historical: 0.02,
    },
  },
  workProbability: {
    peakHours: 0.92,
    overallAvg: 0.61,
    morningLow: 0.05,
    eveningHigh: 0.92,
  },
  behaviorScore: {
    consistency: 0.88,
    reliability: 0.91,
    activityQuality: 0.78,
    overall: 0.86,
  },
};

// ─── Weekly Earnings Sparkline Data ─────────────────────────────

export const earningsSparkline = weeklyEarnings.map((w) => w.net);

// ─── Coverage Window ────────────────────────────────────────────

export const coverageWindow = {
  currentWeekStart: "2026-03-31",
  currentWeekEnd: "2026-04-06",
  renewalDate: "2026-04-07",
  weeksActive: 51,
  totalPaidOut: 1533,
  totalPremiumsPaid: 8415,
  lossRatio: 0.182,
};

// ─── Stat strips for landing page ────────────────────────────────

export const statStrip = [
  { label: "Trigger Latency", value: "< 15m", detail: "event to decision" },
  { label: "Settlement", value: "< 2h", detail: "decision to UPI" },
  { label: "Data Sources", value: "5+", detail: "multi-signal fusion" },
  { label: "Compliance", value: "Parametric", detail: "index-based standard" },
];

// ─── Simulation Presets ─────────────────────────────────────────

export interface EngineResultSection {
  value: string | number;
  label: string;
  subValue?: string;
  status?: "success" | "warning" | "error" | "neutral";
}

export interface SimulationPreset {
  id: string;
  name: string;
  trigger: {
    event: string;
    tcs: number;
    us: number;
    decision: string;
    signals: { name: string; value: number }[];
  };
  attribution: {
    expected: number;
    actual: number;
    rawLoss: number;
    causality: number;
    confidence: number;
    status: string;
  };
  fraud: {
    score: number;
    wpc: number;
    multiplier: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
  };
  payout: {
    baseLoss: number;
    fraudAdj: number;
    incentive: number;
    finalPayout: number;
    status: "PAID" | "REVIEW" | "REJECTED";
  };
  explanation: {
    trigger: string;
    attribution: string;
    fraud: string;
    payout: string;
  };
}

export const simulationPresets: Record<string, SimulationPreset> = {
  "normal-rain": {
    id: "normal-rain",
    name: "Standard Heavy Rain",
    trigger: {
      event: "Heavy Rain (8.2 mm/hr)",
      tcs: 0.88,
      us: 0.12,
      decision: "AUTO_TRIGGER",
      signals: [
        { name: "IoT Sensors", value: 0.92 },
        { name: "OpenWeather", value: 0.85 },
        { name: "Neighbor Zone", value: 0.78 }
      ]
    },
    attribution: {
      expected: 512,
      actual: 120,
      rawLoss: 392,
      causality: 0.85,
      confidence: 0.91,
      status: "STRONG_IMPACT"
    },
    fraud: {
      score: 0.08,
      wpc: 0.94,
      multiplier: 0.96,
      riskLevel: "LOW"
    },
    payout: {
      baseLoss: 392,
      fraudAdj: -15,
      incentive: 100,
      finalPayout: 477,
      status: "PAID"
    },
    explanation: {
      trigger: "Rainfall exceeded the 6 mm/hr threshold across 3 distinct data sources with high confidence (TCS 0.88).",
      attribution: "Worker was active in the affected zone. The drop from ₹512 expected to ₹120 actual correlates directly with the storm window.",
      fraud: "No spoofing detected. GPS ping velocity matches historical storm behavior. Work Probability Score was 94%.",
      payout: "Engine approved base loss of ₹392, applied standard deduction for platform fees, and added peak-hour incentive of ₹100, resulting in ₹477."
    }
  },
  "stress-test": {
    id: "stress-test",
    name: "System Stress Test",
    trigger: {
      event: "Flash Flood (22.5 mm/hr)",
      tcs: 0.95,
      us: 0.35,
      decision: "TRIGGERED_WITH_CAUTION",
      signals: [
        { name: "IoT Sensors", value: 0.98 },
        { name: "OpenWeather", value: 0.95 },
        { name: "Neighbor Zone", value: 0.40 } // high discrepancy
      ]
    },
    attribution: {
      expected: 850,
      actual: 0,
      rawLoss: 850,
      causality: 0.60,
      confidence: 0.55,
      status: "WEAK_CAUSALITY"
    },
    fraud: {
      score: 0.45,
      wpc: 0.40,
      multiplier: 0.50,
      riskLevel: "HIGH"
    },
    payout: {
      baseLoss: 850,
      fraudAdj: -425,
      incentive: 0,
      finalPayout: 425,
      status: "REVIEW"
    },
    explanation: {
      trigger: "Extreme weather detected, but high uncertainty (US 0.35) exists due to conflicting neighbor zone reports.",
      attribution: "Worker logged 0 income, but causality is weak (0.60) because the worker went offline entirely instead of remaining connected.",
      fraud: "Elevated risk (0.45). The Work Probability Curve for this time slot is very low (40%), suggesting the worker might not have worked anyway.",
      payout: "Due to high fraud risk and weak causality, an automated 50% multiplier was applied. Payment suspended pending manual review."
    }
  },
  "shutdown": {
    id: "shutdown",
    name: "Internet Shutdown",
    trigger: {
      event: "Telecom Blackout",
      tcs: 0.99,
      us: 0.05,
      decision: "AUTO_TRIGGER",
      signals: [
        { name: "SFLC Record", value: 1.0 },
        { name: "Ping Drop", value: 0.95 },
        { name: "API Errors", value: 0.99 }
      ]
    },
    attribution: {
      expected: 340,
      actual: 0,
      rawLoss: 340,
      causality: 0.98,
      confidence: 0.95,
      status: "DIRECT_CAUSALITY"
    },
    fraud: {
      score: 0.02,
      wpc: 0.88,
      multiplier: 1.0,
      riskLevel: "LOW"
    },
    payout: {
      baseLoss: 340,
      fraudAdj: 0,
      incentive: 0,
      finalPayout: 340,
      status: "PAID"
    },
    explanation: {
      trigger: "Confirmed internet suspension via Software Freedom Law Center and 99% ping drop rate in the zone.",
      attribution: "100% loss of expected income directly tied to the inability to receive orders.",
      fraud: "Negligible risk. System-wide network failure eliminates individual spoofing vectors.",
      payout: "Full expected loss of ₹340 paid out automatically without deductions."
    }
  }
};

// ─── Registration & Policy Management ──────────────────────────────

export const registrationState = {
  status: "active" as const,
  platform: "Zepto",
  kycVerified: true,
  vehicleVerified: true,
  progressScore: 100,
  steps: [
    { label: "Basic Profile", status: "complete", date: "2025-02-11" },
    { label: "Work History Sync", status: "complete", date: "2025-02-11" },
    { label: "Zone Verification", status: "complete", date: "2025-02-12" },
    { label: "Policy Activation", status: "complete", date: "2025-02-14" },
  ]
};

export const policyHistory = [
  { id: "evt_renew_0401", type: "renewed", date: "2026-03-31", note: "Coverage renewed for week 51", amount: "₹165" },
  { id: "evt_claim_0318", type: "paid", date: "2026-03-18", note: "Payout for Internet Shutdown", amount: "₹487" },
  { id: "evt_adjust_0301", type: "adjusted", date: "2026-03-01", note: "Premium dropped (low risk zone)", amount: "₹165 (was ₹180)" },
  { id: "evt_renew_0228", type: "renewed", date: "2026-02-28", note: "Coverage renewed for week 47", amount: "₹180" },
];

export const coverageTiers = [
  {
    id: "Basic",
    name: "Basic Tier",
    premium: 95,
    coverage: 1500,
    features: ["Rain Disruption", "Zone Closures"],
    recommended: false,
  },
  {
    id: "Standard",
    name: "Standard Tier",
    premium: 165,
    coverage: 2958,
    features: ["Rain Disruption", "Zone Closures", "Internet Shutdown", "Peak-Hour Multipliers"],
    recommended: true,
  },
  {
    id: "Premium",
    name: "Premium Tier",
    premium: 240,
    coverage: 4500,
    features: ["All Standard Features", "Heat Stress Income Drop", "Priority Settlement", "0% Deductible"],
    recommended: false,
  }
];

export const policyRiskPreview = {
  zoneRiskLevel: "High (Monsoon)",
  weatherRisk24h: "78% Probability",
  disruptionExpectation: "Medium/High",
  suggestedPremiumMod: "+₹12/wk (Optional Premium Upgrade)"
};


