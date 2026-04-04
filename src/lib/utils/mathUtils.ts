export function mean(array: number[]): number {
  if (array.length === 0) return 0;
  return array.reduce((sum, val) => sum + val, 0) / array.length;
}

export function median(array: number[]): number {
  if (array.length === 0) return 0;
  const sorted = [...array].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function variance(array: number[]): number {
  if (array.length === 0) return 0;
  const avg = mean(array);
  const squareDiffs = array.map(value => {
    const diff = value - avg;
    return diff * diff;
  });
  return mean(squareDiffs);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function weightedSum(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) return 0;
  
  let sum = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * weights[i];
    totalWeight += weights[i];
  }
  
  return totalWeight === 0 ? 0 : sum / totalWeight;
}
