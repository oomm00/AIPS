/**
 * Pure mathematical utilities for AIPS parametric evaluations.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function safeDivision(numerator: number, denominator: number, fallback: number = 0): number {
  if (denominator === 0 || isNaN(denominator)) return fallback;
  return numerator / denominator;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function weightedAverage(items: Record<string, number>[], valueKey: string, weightKey: string): number {
  if (items.length === 0) return 0;
  let sumProduct = 0;
  let sumWeights = 0;
  for (const item of items) {
    const val = item[valueKey] || 0;
    const weight = item[weightKey] || 0;
    sumProduct += val * weight;
    sumWeights += weight;
  }
  return safeDivision(sumProduct, sumWeights, 0);
}

export function confidenceBlend(scores: number[], confidences: number[]): number {
  if (scores.length !== confidences.length || scores.length === 0) return 0;
  let sumProduct = 0;
  let sumConfidence = 0;
  for (let i = 0; i < scores.length; i++) {
    sumProduct += scores[i] * confidences[i];
    sumConfidence += confidences[i];
  }
  return safeDivision(sumProduct, sumConfidence, 0);
}

export function calculateEarningsConcentration(history: { time_block: string; earnings: number }[]): number {
  if (!history || history.length === 0) return 0;
  const blocks: Record<string, number> = {};
  let total = 0;
  for (const h of history) {
    blocks[h.time_block] = (blocks[h.time_block] || 0) + h.earnings;
    total += h.earnings;
  }
  if (total === 0) return 0;
  
  // Find highest single block concentration ratio
  let maxConcentration = 0;
  for (const block in blocks) {
    const ratio = blocks[block] / total;
    if (ratio > maxConcentration) maxConcentration = ratio;
  }
  return maxConcentration;
}
