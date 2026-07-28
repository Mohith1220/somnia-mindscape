import {
  DEMO_SCENARIOS,
  type AnalysisResult,
  type ConditionKey,
  type Features,
} from "./demo-data";

export function parseCSVNumbers(text: string): number[] {
  const nums: number[] = [];
  // Split on any non-numeric separator: commas, whitespace, semicolons, tabs
  const tokens = text.split(/[\s,;]+/);
  for (const tok of tokens) {
    if (!tok) continue;
    const n = Number(tok);
    if (Number.isFinite(n)) nums.push(n);
  }
  return nums;
}

export function computeFeatures(values: number[]): Features {
  if (!values.length) {
    return { mean: 0, std: 0, variance: 0, min: 0, max: 0 };
  }
  const n = values.length;
  let sum = 0;
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const mean = sum / n;
  let sq = 0;
  for (const v of values) sq += (v - mean) ** 2;
  const variance = sq / n;
  const std = Math.sqrt(variance);
  return { mean, std, variance, min, max };
}

function classify(features: Features): ConditionKey {
  const { variance, std, min, max } = features;
  const absMax = Math.max(Math.abs(min), Math.abs(max));
  if (variance >= 1000 || absMax >= 120) return "seizure";
  if (variance >= 400 || absMax >= 70) return "apnea";
  if (variance >= 200 || std >= 15) return "insomnia";
  return "normal";
}

const REF_VARIANCE: Record<ConditionKey, number> = {
  normal: 152.3,
  insomnia: 350.4,
  apnea: 605.7,
  seizure: 1779.2,
};

function computeProbabilities(features: Features, chosen: ConditionKey) {
  const v = Math.max(1, features.variance);
  const weights: Record<ConditionKey, number> = {
    normal: 0, insomnia: 0, apnea: 0, seizure: 0,
  };
  (Object.keys(REF_VARIANCE) as ConditionKey[]).forEach((k) => {
    const d = Math.abs(Math.log(v / REF_VARIANCE[k]));
    weights[k] = Math.exp(-d * 2.4);
  });
  // Bias slightly toward chosen for confidence
  weights[chosen] *= 1.35;
  const total = weights.normal + weights.insomnia + weights.apnea + weights.seizure;
  const scale = 100 / total;
  const raw = {
    normal: weights.normal * scale,
    insomnia: weights.insomnia * scale,
    apnea: weights.apnea * scale,
    seizure: weights.seizure * scale,
  };
  // Round to 1 decimal and re-balance to keep total ≈ 100
  const rounded: Record<ConditionKey, number> = {
    normal: Math.round(raw.normal * 10) / 10,
    insomnia: Math.round(raw.insomnia * 10) / 10,
    apnea: Math.round(raw.apnea * 10) / 10,
    seizure: Math.round(raw.seizure * 10) / 10,
  };
  const drift = 100 - (rounded.normal + rounded.insomnia + rounded.apnea + rounded.seizure);
  rounded[chosen] = Math.round((rounded[chosen] + drift) * 10) / 10;
  return rounded;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pad(n: number, len = 2) {
  return n.toString().padStart(len, "0");
}

export function buildResultFromFeatures(
  features: Features,
  sourceName: string,
): AnalysisResult {
  const condition = classify(features);
  const probabilities = computeProbabilities(features, condition);
  const confidence = probabilities[condition];
  const template = DEMO_SCENARIOS[condition];

  const seedBase =
    hashString(`${sourceName}|${features.mean}|${features.std}|${features.variance}`);
  const waveformSeed = (seedBase % 9973) + 1;

  const now = new Date();
  const datePart = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const idSuffix = (seedBase % 900 + 100).toString();
  const id = `SA-${datePart}-${idSuffix}`;

  return {
    ...template,
    id,
    timestamp: now.toISOString(),
    condition,
    conditionLabel: template.conditionLabel,
    confidence,
    probabilities,
    features,
    waveformSeed,
  };
}

export async function analyzeCSVFile(file: File): Promise<AnalysisResult> {
  const text = await file.text();
  const values = parseCSVNumbers(text);
  if (values.length < 8) {
    throw new Error("The uploaded file does not contain enough numeric samples to analyze.");
  }
  const features = computeFeatures(values);
  return buildResultFromFeatures(features, file.name);
}
