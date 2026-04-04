import { Signal } from "../models/engineTypes";

export function generateWorker() {
  return {
    id: "wkr_" + Math.random().toString(36).substring(2, 8),
    zone: "HSR-BLR-07",
    tier: "Standard",
    bwe: 4500, // Baseline Weekly Earning
    historicalRisk: 0.12,
  };
}

export function generateRainEvent() {
  return {
    eventId: "evt_" + Math.random().toString(36).substring(2, 8),
    type: "Heavy Rain",
    zone: "HSR-BLR-07",
    intensity: 18.5, // mm/hr
    startTime: "2026-04-03T18:00:00Z",
    endTime: "2026-04-03T21:00:00Z",
  };
}

export function generateSignals(): Signal[] {
  return [
    { value: 0.95, weight: 0.4, reliability: 0.9, available: true }, // IoT Sensors
    { value: 0.88, weight: 0.3, reliability: 0.85, available: true }, // OpenWeather API
    { value: 0.75, weight: 0.3, reliability: 0.7, available: true }, // Surrounding Zone Consensus
  ];
}
