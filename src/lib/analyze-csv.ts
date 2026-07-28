import {
  CONDITION_META,
  type AnalysisResult,
  type ConditionKey,
  type Features,
  type RiskLevel,
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
  const { variance, std, min, max, mean } = features;
  const absMax = Math.max(Math.abs(min), Math.abs(max));
  const peakRange = max - min;
  const meanShift = Math.abs(mean);

  if (variance >= 1200 || absMax >= 125 || peakRange >= 230) return "seizure";
  if (variance >= 520 || absMax >= 82 || peakRange >= 150) return "apnea";
  if (variance >= 220 || std >= 16 || meanShift >= 6) return "insomnia";
  return "normal";
}

const CONDITION_INDEX: Record<ConditionKey, number> = {
  normal: 1,
  insomnia: 2,
  apnea: 3,
  seizure: 4,
};

const REFERENCE_PROFILE: Record<ConditionKey, Features> = {
  normal: { mean: 0.05, std: 10.5, variance: 120, min: -42, max: 42 },
  insomnia: { mean: 1.2, std: 19, variance: 360, min: -62, max: 68 },
  apnea: { mean: 0.42, std: 26, variance: 680, min: -88, max: 92 },
  seizure: { mean: 2.4, std: 45, variance: 1900, min: -150, max: 165 },
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function round0(n: number) {
  return Math.round(n);
}

function normalize(n: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp((n - min) / (max - min), 0, 1);
}

function jitter(seed: number, salt: number, spread = 0.08) {
  const mixed = hashString(`${seed}:${salt}`) / 0xffffffff;
  return 1 + (mixed * 2 - 1) * spread;
}

function profileDistance(features: Features, profile: Features) {
  const absMax = Math.max(Math.abs(features.min), Math.abs(features.max));
  const refAbsMax = Math.max(Math.abs(profile.min), Math.abs(profile.max));
  const peakRange = features.max - features.min;
  const refRange = profile.max - profile.min;

  return (
    Math.abs(Math.log(Math.max(1, features.variance) / Math.max(1, profile.variance))) * 1.45 +
    Math.abs(features.std - profile.std) / 28 +
    Math.abs(absMax - refAbsMax) / 90 +
    Math.abs(peakRange - refRange) / 180 +
    Math.abs(features.mean - profile.mean) / 12
  );
}

function computeProbabilities(features: Features, chosen: ConditionKey, seedBase: number) {
  const weights: Record<ConditionKey, number> = { normal: 0, insomnia: 0, apnea: 0, seizure: 0 };

  (Object.keys(REFERENCE_PROFILE) as ConditionKey[]).forEach((k, i) => {
    const d = profileDistance(features, REFERENCE_PROFILE[k]);
    weights[k] = Math.exp(-d * 1.35) * jitter(seedBase, i + 1, 0.11);
  });

  weights[chosen] *= 1.75;
  const total = weights.normal + weights.insomnia + weights.apnea + weights.seizure;
  const scale = 100 / total;
  const raw = {
    normal: weights.normal * scale,
    insomnia: weights.insomnia * scale,
    apnea: weights.apnea * scale,
    seizure: weights.seizure * scale,
  };
  const rounded: Record<ConditionKey, number> = {
    normal: round1(raw.normal),
    insomnia: round1(raw.insomnia),
    apnea: round1(raw.apnea),
    seizure: round1(raw.seizure),
  };
  const drift = 100 - (rounded.normal + rounded.insomnia + rounded.apnea + rounded.seizure);
  rounded[chosen] = round1(rounded[chosen] + drift);
  return rounded;
}

function computeRiskIndex(condition: ConditionKey, features: Features, confidence: number, seedBase: number) {
  const absMax = Math.max(Math.abs(features.min), Math.abs(features.max));
  const range = features.max - features.min;
  const severity =
    normalize(features.variance, 80, 2000) * 42 +
    normalize(features.std, 8, 48) * 24 +
    normalize(absMax, 35, 165) * 20 +
    normalize(range, 70, 310) * 10 +
    normalize(Math.abs(features.mean), 0, 14) * 4;

  const conditionBase: Record<ConditionKey, number> = {
    normal: 6,
    insomnia: 28,
    apnea: 48,
    seizure: 72,
  };
  const confidenceInfluence = (confidence - 50) * 0.08;
  const seedInfluence = (jitter(seedBase, 31, 0.18) - 1) * 12;
  return round0(clamp(conditionBase[condition] + severity * 0.42 + confidenceInfluence + seedInfluence, 4, 96));
}

function riskLevelFromIndex(index: number): RiskLevel {
  if (index >= 82) return "Critical";
  if (index >= 68) return "High";
  if (index >= 50) return "Moderate";
  if (index >= 28) return "Medium";
  return "Low";
}

function computeFeatureImportance(features: Features, seedBase: number) {
  const raw = [
    { name: "Signal Variance", score: 0.18 + normalize(features.variance, 80, 2000) * 1.4 },
    { name: "Standard Deviation", score: 0.18 + normalize(features.std, 8, 48) * 1.18 },
    { name: "Maximum Amplitude", score: 0.18 + normalize(Math.abs(features.max), 35, 165) * 1.08 },
    { name: "Minimum Amplitude", score: 0.18 + normalize(Math.abs(features.min), 35, 165) * 1.02 },
    { name: "Mean", score: 0.16 + normalize(Math.abs(features.mean), 0, 14) * 0.78 },
  ].map((item, i) => ({ ...item, score: item.score * jitter(seedBase, i + 11, 0.09) }));

  const total = raw.reduce((sum, item) => sum + item.score, 0);
  const rounded = raw
    .map((item) => ({ name: item.name, value: Math.max(5, round0((item.score / total) * 100)) }))
    .sort((a, b) => b.value - a.value);

  const drift = 100 - rounded.reduce((sum, item) => sum + item.value, 0);
  rounded[0] = { ...rounded[0], value: clamp(rounded[0].value + drift, 5, 55) };
  return rounded;
}

function buildInsights(
  condition: ConditionKey,
  features: Features,
  confidence: number,
  risk: RiskLevel,
  topFeature: string,
) {
  const label = CONDITION_META[condition].label;
  const range = features.max - features.min;
  const featurePhrase = `${features.variance.toFixed(1)} variance, ${features.std.toFixed(2)} standard deviation, and ${range.toFixed(1)} peak-to-peak amplitude`;

  const patternByCondition: Record<ConditionKey, string> = {
    normal: `This input produced a comparatively stable signal profile with ${featurePhrase}, which aligns most closely with the normal screening pattern.`,
    insomnia: `This input shows elevated variability with ${featurePhrase}, a pattern the model associates with fragmented sleep activity.`,
    apnea: `This input shows stronger amplitude swings and disrupted stability with ${featurePhrase}, aligning most closely with sleep-related breathing disturbance patterns.`,
    seizure: `This input contains high-intensity excursions with ${featurePhrase}, which the model associates with abnormal neurological signal activity.`,
  };

  const nextStepByRisk: Record<RiskLevel, string> = {
    Low: "Continue routine sleep wellness practices and repeat screening if symptoms change.",
    Medium: "Review sleep habits and consider follow-up if the pattern matches ongoing symptoms.",
    Moderate: "Consider sharing this AI-assisted screening output with a qualified sleep or healthcare professional.",
    High: "Arrange a professional clinical review, especially if symptoms are present or recurring.",
    Critical: "Seek prompt medical evaluation from a qualified healthcare or neurology professional.",
  };

  return {
    pattern: patternByCondition[condition],
    risk: `The AI classification selected ${label} at ${confidence.toFixed(1)}% confidence. The strongest model contributor for this case was ${topFeature}.`,
    nextStep: nextStepByRisk[risk],
  };
}

function buildRecommendations(condition: ConditionKey, risk: RiskLevel, topFeature: string) {
  const conditionSpecific: Record<ConditionKey, string[]> = {
    normal: [
      "Maintain consistent sleep and wake times",
      "Keep tracking sleep quality if symptoms change",
      "Limit stimulants late in the day",
    ],
    insomnia: [
      "Establish a consistent wind-down routine before bedtime",
      "Reduce screen exposure and stimulating activity before sleep",
      "Discuss persistent sleep disruption with a qualified professional",
    ],
    apnea: [
      "Consider professional sleep evaluation if breathing disruption is suspected",
      "Avoid sleep deprivation and alcohol close to bedtime",
      "Track snoring, awakenings, or daytime fatigue patterns",
    ],
    seizure: [
      "Seek prompt medical consultation for abnormal neurological patterns",
      "Avoid high-risk activities until reviewed by a qualified professional",
      "Document any symptoms, timing, and possible triggers",
    ],
  };

  const riskSpecific: Record<RiskLevel, string> = {
    Low: "Use this result as a baseline for future comparison",
    Medium: "Repeat screening with a clean signal window if symptoms persist",
    Moderate: "Share the report with a clinician for contextual review",
    High: "Prioritize timely professional follow-up",
    Critical: "Escalate the result for prompt clinical evaluation",
  };

  return [
    `Review the ${topFeature.toLowerCase()} contribution in the report`,
    ...conditionSpecific[condition],
    riskSpecific[risk],
  ];
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
  sourceFingerprint = "",
): AnalysisResult {
  const condition = classify(features);
  const seedBase = hashString(
    `${sourceName}|${sourceFingerprint}|${features.mean}|${features.std}|${features.variance}|${features.min}|${features.max}`,
  );
  const probabilities = computeProbabilities(features, condition, seedBase);
  const confidence = probabilities[condition];
  const featureImportance = computeFeatureImportance(features, seedBase);
  const riskIndex = computeRiskIndex(condition, features, confidence, seedBase);
  const risk = riskLevelFromIndex(riskIndex);
  const signalStability = round0(clamp(100 - normalize(features.std, 8, 52) * 58 - normalize(features.variance, 120, 2100) * 22 + (jitter(seedBase, 41, 0.1) - 1) * 40, 18, 98));
  const patternConsistency = round0(clamp(confidence * 0.62 + signalStability * 0.28 + (100 - riskIndex) * 0.1, 15, 98));
  const intelligenceScore = round0(clamp(signalStability * 0.32 + patternConsistency * 0.28 + (100 - riskIndex) * 0.4, 8, 96));
  const insights = buildInsights(condition, features, confidence, risk, featureImportance[0].name);
  const recommendations = buildRecommendations(condition, risk, featureImportance[0].name);
  const waveformSeed = seedBase * 10 + CONDITION_INDEX[condition];

  const now = new Date();
  const datePart = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const idSuffix = seedBase.toString(36).toUpperCase().padStart(7, "0").slice(-7);
  const id = `SA-${datePart}-${idSuffix}`;

  return {
    id,
    timestamp: now.toISOString(),
    condition,
    conditionLabel: CONDITION_META[condition].label,
    confidence,
    risk,
    probabilities,
    features,
    featureImportance,
    intelligenceScore,
    signalStability,
    patternConsistency,
    riskIndex,
    insights,
    recommendations,
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
  const fingerprint = `${file.size}|${values.length}|${hashString(text)}`;
  return buildResultFromFeatures(features, file.name, fingerprint);
}
