import {
  CONDITION_META,
  generateWaveform,
  type AnalysisResult,
  type ConditionKey,
  type Features,
  type RiskLevel,
} from "./demo-data";

export function parseCSVNumbers(text: string): number[] {
  const nums: number[] = [];
  const numberPattern = /[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;
  const rows = text.split(/\r?\n/);

  for (const row of rows) {
    const matches = row.match(numberPattern);
    if (!matches?.length) continue;
    const parsed = matches.map(Number).filter(Number.isFinite);
    if (!parsed.length) continue;
    // For common time,value CSVs, analyze the signal column rather than mixing timestamps into the EEG values.
    nums.push(parsed.length > 1 ? parsed[parsed.length - 1] : parsed[0]);
  }

  if (nums.length) return nums;

  for (const match of text.matchAll(numberPattern)) {
    const n = Number(match[0]);
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

type SignalProfile = AnalysisResult["signalProfile"];

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function analyzeSignalProfile(values: number[], features: Features): SignalProfile {
  const centered = values.map((v) => v - features.mean);
  const diffs = values.slice(1).map((v, i) => Math.abs(v - values[i]));
  const med = median(values);
  const mad = median(values.map((v) => Math.abs(v - med))) || features.std * 0.6745 || 1;
  const robustThreshold = Math.max(features.std * 1.45, mad * 3.4, (features.max - features.min) * 0.18, 8);
  let peakCount = 0;
  let zeroCrossings = 0;

  for (let i = 1; i < centered.length; i++) {
    if ((centered[i - 1] <= 0 && centered[i] > 0) || (centered[i - 1] >= 0 && centered[i] < 0)) {
      zeroCrossings += 1;
    }
  }

  for (let i = 1; i < values.length - 1; i++) {
    const deviation = Math.abs(values[i] - med);
    const isLocalHigh = values[i] > values[i - 1] && values[i] >= values[i + 1];
    const isLocalLow = values[i] < values[i - 1] && values[i] <= values[i + 1];
    if (deviation >= robustThreshold && (isLocalHigh || isLocalLow)) peakCount += 1;
  }

  const peakToPeak = features.max - features.min;
  const volatility = diffs.length ? diffs.reduce((sum, v) => sum + v, 0) / diffs.length : 0;
  const absMax = Math.max(Math.abs(features.min), Math.abs(features.max), 1);
  const instability = round0(
    clamp(
      normalize(features.variance, 60, 3200) * 36 +
        normalize(features.std, 6, 65) * 26 +
        normalize(peakToPeak, 45, 360) * 22 +
        normalize(volatility, 4, 75) * 10 +
        normalize((peakCount / Math.max(1, values.length)) * 100, 0, 8) * 6,
      0,
      100,
    ),
  );

  return {
    sampleCount: values.length,
    peakCount,
    zeroCrossings,
    peakToPeak,
    volatility,
    instability,
    asymmetry: round1((Math.abs(Math.abs(features.max) - Math.abs(features.min)) / absMax) * 100),
  };
}

function classify(features: Features, profile: SignalProfile): ConditionKey {
  const { variance, std, min, max, mean } = features;
  const absMax = Math.max(Math.abs(min), Math.abs(max));
  const peakRange = max - min;
  const meanShift = Math.abs(mean);
  const peakDensity = (profile.peakCount / Math.max(1, profile.sampleCount)) * 100;

  if (
    variance >= 2400 ||
    std >= 54 ||
    absMax >= 155 ||
    peakRange >= 300 ||
    (profile.peakCount >= 2 && absMax >= 135 && variance >= 1300)
  ) return "seizure";

  if (
    (profile.peakCount >= 3 && peakRange >= 130 && variance >= 330) ||
    (profile.peakCount >= 2 && absMax >= 88 && variance >= 500) ||
    (peakDensity >= 1.2 && peakRange >= 165 && profile.zeroCrossings >= profile.sampleCount * 0.06)
  ) return "apnea";

  if (variance >= 180 || std >= 13.5 || profile.volatility >= 10 || meanShift >= 5 || peakRange >= 100) return "insomnia";
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

function computeConfidence(condition: ConditionKey, features: Features, profile: SignalProfile, seedBase: number) {
  const absMax = Math.max(Math.abs(features.min), Math.abs(features.max));
  const range = features.max - features.min;
  const noise = (jitter(seedBase, 101, 0.06) - 1) * 100;

  const rawByCondition: Record<ConditionKey, number> = {
    normal:
      88 +
      (1 - normalize(features.variance, 45, 190)) * 3.2 +
      (1 - normalize(features.std, 5, 14)) * 2.2 +
      (1 - normalize(range, 40, 100)) * 1.6 +
      noise,
    insomnia:
      72 +
      normalize(features.variance, 180, 760) * 7.5 +
      normalize(features.std, 13.5, 30) * 5.2 +
      normalize(profile.volatility, 9, 36) * 3.8 +
      (1 - normalize(profile.peakCount, 2, 8)) * 2.4 +
      noise,
    apnea:
      75 +
      normalize(range, 125, 240) * 7.2 +
      normalize(features.variance, 330, 1250) * 5.8 +
      normalize(profile.peakCount, 2, 12) * 4.8 +
      normalize(absMax, 78, 130) * 2.4 +
      noise,
    seizure:
      80 +
      normalize(absMax, 115, 230) * 6.5 +
      normalize(features.variance, 1000, 5200) * 6.2 +
      normalize(features.std, 34, 82) * 4.1 +
      normalize(profile.instability, 55, 100) * 2.2 +
      noise,
  };

  const bounds: Record<ConditionKey, [number, number]> = {
    normal: [88, 96],
    insomnia: [72, 91],
    apnea: [75, 95],
    seizure: [80, 98],
  };
  const [min, max] = bounds[condition];
  return round1(clamp(rawByCondition[condition], min, max));
}

function computeProbabilities(features: Features, chosen: ConditionKey, confidence: number, seedBase: number) {
  const weights: Record<ConditionKey, number> = { normal: 0, insomnia: 0, apnea: 0, seizure: 0 };

  (Object.keys(REFERENCE_PROFILE) as ConditionKey[]).forEach((k, i) => {
    if (k === chosen) return;
    const d = profileDistance(features, REFERENCE_PROFILE[k]);
    weights[k] = Math.max(0.001, Math.exp(-d * 1.15) * jitter(seedBase, i + 1, 0.18));
  });

  const total = Object.entries(weights)
    .filter(([k]) => k !== chosen)
    .reduce((sum, [, value]) => sum + value, 0);
  const remainder = round1(100 - confidence);
  const rounded: Record<ConditionKey, number> = {
    normal: chosen === "normal" ? confidence : round1((weights.normal / total) * remainder),
    insomnia: chosen === "insomnia" ? confidence : round1((weights.insomnia / total) * remainder),
    apnea: chosen === "apnea" ? confidence : round1((weights.apnea / total) * remainder),
    seizure: chosen === "seizure" ? confidence : round1((weights.seizure / total) * remainder),
  };
  const drift = 100 - (rounded.normal + rounded.insomnia + rounded.apnea + rounded.seizure);
  const adjustmentTarget = (Object.keys(rounded) as ConditionKey[])
    .filter((k) => k !== chosen)
    .sort((a, b) => rounded[b] - rounded[a])[0];
  rounded[adjustmentTarget] = round1(Math.max(0, rounded[adjustmentTarget] + drift));
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

function computeFeatureImportance(features: Features, profile: SignalProfile, condition: ConditionKey, seedBase: number) {
  const conditionBoost: Record<ConditionKey, Record<string, number>> = {
    normal: { Mean: 1.2, "Minimum Amplitude": 1.08, "Signal Variance": 0.95, "Maximum Amplitude": 1.02, "Standard Deviation": 0.98 },
    insomnia: { "Standard Deviation": 1.32, "Signal Variance": 1.24, Mean: 1.08, "Maximum Amplitude": 0.96, "Minimum Amplitude": 0.94 },
    apnea: { "Maximum Amplitude": 1.26, "Minimum Amplitude": 1.22, "Signal Variance": 1.18, "Standard Deviation": 1.06, Mean: 0.92 },
    seizure: { "Maximum Amplitude": 1.34, "Signal Variance": 1.28, "Standard Deviation": 1.18, "Minimum Amplitude": 1.14, Mean: 0.82 },
  };
  const raw = [
    { name: "Signal Variance", score: 0.35 + normalize(features.variance, 45, 3400) * 1.8 + normalize(profile.instability, 0, 100) * 0.35 },
    { name: "Standard Deviation", score: 0.32 + normalize(features.std, 5, 68) * 1.6 + normalize(profile.volatility, 2, 75) * 0.42 },
    { name: "Maximum Amplitude", score: 0.3 + normalize(Math.abs(features.max), 18, 220) * 1.65 + normalize(profile.peakCount, 0, 12) * 0.28 },
    { name: "Minimum Amplitude", score: 0.3 + normalize(Math.abs(features.min), 18, 220) * 1.58 + normalize(profile.asymmetry, 0, 70) * 0.2 },
    { name: "Mean", score: 0.34 + normalize(Math.abs(features.mean), 0, 16) * 1.45 + (1 - normalize(profile.instability, 10, 85)) * 0.22 },
  ].map((item, i) => ({
    ...item,
    score: item.score * conditionBoost[condition][item.name] * jitter(seedBase, i + 11, 0.22),
  }));

  const total = raw.reduce((sum, item) => sum + item.score, 0);
  const rounded = raw.map((item) => ({ name: item.name, value: Math.max(6, round0((item.score / total) * 100)) }));
  let drift = 100 - rounded.reduce((sum, item) => sum + item.value, 0);
  const order = [...rounded].sort((a, b) => b.value - a.value).map((item) => item.name);
  let cursor = 0;
  while (drift !== 0 && cursor < 200) {
    const name = order[cursor % order.length];
    const item = rounded.find((x) => x.name === name);
    if (item && (drift > 0 || item.value > 6)) {
      item.value += drift > 0 ? 1 : -1;
      drift += drift > 0 ? -1 : 1;
    }
    cursor += 1;
  }
  return rounded.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

function buildInsights(
  condition: ConditionKey,
  features: Features,
  profile: SignalProfile,
  confidence: number,
  risk: RiskLevel,
  topFeature: string,
  seedBase: number,
) {
  const label = CONDITION_META[condition].label;
  const range = features.max - features.min;
  const featurePhrase = `${features.variance.toFixed(1)} variance, ${features.std.toFixed(2)} standard deviation, ${range.toFixed(1)} peak-to-peak amplitude, and ${profile.peakCount} abnormal peak${profile.peakCount === 1 ? "" : "s"}`;
  const variant = hashString(`${seedBase}:insight`) % 3;

  const patternByCondition: Record<ConditionKey, string[]> = {
    normal: [
      `Signal stability is within the expected physiological range for this upload: ${featurePhrase}.`,
      `The uploaded samples form a low-variability trace with ${featurePhrase}, supporting the selected normal screening pattern.`,
      `This CSV produced a stable neural signal window; measured values show ${featurePhrase}.`,
    ],
    insomnia: [
      `Elevated variance indicates fragmented sleep architecture in this upload, with ${featurePhrase}.`,
      `The signal window shows irregular dispersion and sleep-pattern fragmentation: ${featurePhrase}.`,
      `This CSV contains sustained variability rather than isolated extreme spikes, measured as ${featurePhrase}.`,
    ],
    apnea: [
      `Amplitude irregularities may suggest obstructive breathing-event patterns in this upload, with ${featurePhrase}.`,
      `The model detected repeated high-amplitude disruptions across the signal window: ${featurePhrase}.`,
      `This CSV shows recurring amplitude changes and elevated instability, summarized by ${featurePhrase}.`,
    ],
    seizure: [
      `Signal complexity indicates neurological abnormalities requiring further assessment, with ${featurePhrase}.`,
      `The uploaded values include extreme excursions and high instability: ${featurePhrase}.`,
      `This signal window contains very abnormal spike intensity, summarized as ${featurePhrase}.`,
    ],
  };

  const nextStepByRisk: Record<RiskLevel, string> = {
    Low: "Continue routine sleep wellness practices and repeat screening if symptoms change.",
    Medium: "Review sleep habits and consider follow-up if the pattern matches ongoing symptoms.",
    Moderate: "Consider sharing this AI-assisted screening output with a qualified sleep or healthcare professional.",
    High: "Arrange a professional clinical review, especially if symptoms are present or recurring.",
    Critical: "Seek prompt medical evaluation from a qualified healthcare or neurology professional.",
  };

  return {
    pattern: patternByCondition[condition][variant],
    risk: `The AI classification selected ${label} at ${confidence.toFixed(1)}% confidence, matching the ${label} probability bar. The strongest contributor for this case was ${topFeature}, with an instability index of ${profile.instability}/100.`,
    nextStep: nextStepByRisk[risk],
  };
}

function pickRotated(items: string[], seedBase: number, salt: number, count: number) {
  const start = hashString(`${seedBase}:${salt}`) % items.length;
  return Array.from({ length: Math.min(count, items.length) }, (_, i) => items[(start + i) % items.length]);
}

function buildRecommendations(condition: ConditionKey, risk: RiskLevel, topFeature: string, features: Features, profile: SignalProfile, seedBase: number) {
  const conditionSpecific: Record<ConditionKey, string[]> = {
    normal: [
      "Maintain healthy sleep hygiene with consistent sleep and wake times",
      "Continue regular exercise and daytime light exposure",
      "Monitor sleep schedule if symptoms or fatigue patterns change",
      "Keep caffeine and late stimulant intake moderate",
      "Use this stable signal window as a baseline for future comparison",
    ],
    insomnia: [
      "Reduce caffeine, especially later in the day",
      "Improve sleep hygiene with a predictable wind-down routine",
      "Consider CBT-I strategies if sleep disruption persists",
      "Reduce screen exposure and stimulating activity before bedtime",
      "Track awakenings and sleep latency alongside future screenings",
    ],
    apnea: [
      "Recommend a professional sleep study when symptoms match the screening pattern",
      "Consult a sleep specialist about breathing-related sleep disruption",
      "Evaluate CPAP suitability with a qualified clinician if clinically indicated",
      "Track snoring, awakenings, oxygen concerns, or daytime fatigue patterns",
      "Avoid alcohol and heavy sedatives close to bedtime unless clinically advised",
    ],
    seizure: [
      "Recommend urgent neurological evaluation for this abnormal signal pattern",
      "EEG confirmation is advised through qualified clinical testing",
      "Consult a neurologist immediately if symptoms or events are present",
      "Avoid high-risk activities until reviewed by a qualified professional",
      "Document symptoms, timing, and possible triggers for clinical review",
    ],
  };

  const riskSpecific: Record<RiskLevel, string> = {
    Low: "Use this result as a baseline for future comparison",
    Medium: "Repeat screening with a clean signal window if symptoms persist",
    Moderate: "Share the report with a clinician for contextual review",
    High: "Prioritize timely professional follow-up",
    Critical: "Escalate the result for prompt clinical evaluation",
  };

  const dynamic =
    profile.peakCount > 0
      ? `Review ${profile.peakCount} detected abnormal peak${profile.peakCount === 1 ? "" : "s"} and the ${topFeature.toLowerCase()} contribution in the report`
      : `Review the ${topFeature.toLowerCase()} contribution and variance value of ${features.variance.toFixed(1)} in the report`;

  return [dynamic, ...pickRotated(conditionSpecific[condition], seedBase, 61, 3), riskSpecific[risk]];
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
  sourceValues?: number[],
): AnalysisResult {
  const seedBase = hashString(
    `${sourceName}|${sourceFingerprint}|${features.mean}|${features.std}|${features.variance}|${features.min}|${features.max}`,
  );
  const signalSamples = buildSignalSamples(sourceValues, features, seedBase);
  const signalProfile = analyzeSignalProfile(sourceValues?.length ? sourceValues : signalSamples, features);
  const condition = classify(features, signalProfile);
  const confidence = computeConfidence(condition, features, signalProfile, seedBase);
  const probabilities = computeProbabilities(features, condition, confidence, seedBase);
  const featureImportance = computeFeatureImportance(features, signalProfile, condition, seedBase);
  const riskIndex = computeRiskIndex(condition, features, confidence, seedBase);
  const risk = riskLevelFromIndex(riskIndex);
  const signalStability = round0(clamp(100 - normalize(features.std, 8, 52) * 58 - normalize(features.variance, 120, 2100) * 22 + (jitter(seedBase, 41, 0.1) - 1) * 40, 18, 98));
  const patternConsistency = round0(clamp(confidence * 0.62 + signalStability * 0.28 + (100 - riskIndex) * 0.1, 15, 98));
  const intelligenceScore = round0(clamp(signalStability * 0.32 + patternConsistency * 0.28 + (100 - riskIndex) * 0.4, 8, 96));
  const insights = buildInsights(condition, features, signalProfile, confidence, risk, featureImportance[0].name, seedBase);
  const recommendations = buildRecommendations(condition, risk, featureImportance[0].name, features, signalProfile, seedBase);
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
    signalSamples,
    signalProfile,
  };
}

function buildSignalSamples(sourceValues: number[] | undefined, features: Features, seedBase: number, targetPoints = 400) {
  const source = sourceValues?.filter(Number.isFinite) ?? [];
  if (source.length >= 2) {
    if (source.length === targetPoints) return source.map((v) => round1(v));
    const out: number[] = [];
    for (let i = 0; i < targetPoints; i++) {
      const pos = (i / (targetPoints - 1)) * (source.length - 1);
      const left = Math.floor(pos);
      const right = Math.min(source.length - 1, left + 1);
      const mix = pos - left;
      out.push(round1(source[left] * (1 - mix) + source[right] * mix));
    }
    return out;
  }

  const synthetic = generateWaveform(seedBase, targetPoints);
  const maxSynthetic = Math.max(...synthetic.map(Math.abs)) || 1;
  const desiredAbs = Math.max(Math.abs(features.min), Math.abs(features.max), features.std * 2, 1);
  return synthetic.map((v) => round1(features.mean + (v / maxSynthetic) * desiredAbs));
}

export async function analyzeCSVFile(file: File): Promise<AnalysisResult> {
  const text = await file.text();
  const values = parseCSVNumbers(text);
  if (values.length < 8) {
    throw new Error("The uploaded file does not contain enough numeric samples to analyze.");
  }
  const features = computeFeatures(values);
  const fingerprint = `${file.name}|${file.size}|${file.lastModified}|${values.length}|${hashString(text)}`;
  return buildResultFromFeatures(features, file.name, fingerprint, values);
}
