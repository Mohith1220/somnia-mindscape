import {
  CONDITION_META,
  type AnalysisResult,
  type ConditionKey,
  type Features,
  type RiskLevel,
} from "./analysis-types";
import { CONDITION_BY_ID, predictWithBackend, type BackendPrediction } from "./ml-api";

export function parseCSVNumbers(text: string): number[] {
  const nums: number[] = [];
  const numberPattern = /[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;
  const rows = text.split(/\r?\n/);
  const numericRows: number[][] = [];

  for (const row of rows) {
    const matches = row.match(numberPattern);
    if (!matches?.length) continue;
    const parsed = matches.map(Number).filter(Number.isFinite);
    if (!parsed.length) continue;
    numericRows.push(parsed);
  }

  if (numericRows.length > 1) {
    const sameColumnCount = numericRows.every((row) => row.length === numericRows[0].length);
    const useLastColumn = sameColumnCount && numericRows[0].length > 1;
    return numericRows.map((row) => (useLastColumn ? row[row.length - 1] : row[0]));
  }

  if (numericRows.length === 1) return numericRows[0];

  for (const match of text.matchAll(numberPattern)) {
    const n = Number(match[0]);
    if (Number.isFinite(n)) nums.push(n);
  }
  return nums;
}

export function computeFeatures(values: number[]): Features {
  if (!values.length) return { mean: 0, std: 0, variance: 0, min: 0, max: 0 };
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
  return { mean, std: Math.sqrt(variance), variance, min, max };
}

type SignalProfile = AnalysisResult["signalProfile"];

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

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

/** Descriptive statistics of the uploaded signal — measured, never generated. */
function analyzeSignalProfile(values: number[], features: Features): SignalProfile {
  const centered = values.map((v) => v - features.mean);
  const diffs = values.slice(1).map((v, i) => Math.abs(v - values[i]));
  const med = median(values);
  const mad = median(values.map((v) => Math.abs(v - med))) || features.std * 0.6745 || 1;
  const robustThreshold = Math.max(features.std * 1.45, mad * 3.4, (features.max - features.min) * 0.18, 8);
  let peakCount = 0;
  let zeroCrossings = 0;

  for (let i = 1; i < centered.length; i++) {
    if ((centered[i - 1] <= 0 && centered[i] > 0) || (centered[i - 1] >= 0 && centered[i] < 0)) zeroCrossings += 1;
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

const CONDITION_INDEX: Record<ConditionKey, number> = { normal: 1, insomnia: 2, apnea: 3, seizure: 4 };

function riskIndexFor(condition: ConditionKey, features: Features, confidence: number, profile: SignalProfile) {
  const absMax = Math.max(Math.abs(features.min), Math.abs(features.max));
  const severity =
    normalize(features.variance, 80, 2000) * 42 +
    normalize(features.std, 8, 48) * 24 +
    normalize(absMax, 35, 165) * 20 +
    normalize(features.max - features.min, 70, 310) * 10 +
    normalize(profile.instability, 10, 95) * 4;
  const conditionBase: Record<ConditionKey, number> = { normal: 6, insomnia: 28, apnea: 48, seizure: 72 };
  return round0(clamp(conditionBase[condition] + severity * 0.42 + (confidence - 50) * 0.08, 4, 96));
}

function riskLevelFromIndex(index: number): RiskLevel {
  if (index >= 82) return "Critical";
  if (index >= 68) return "High";
  if (index >= 50) return "Moderate";
  if (index >= 28) return "Medium";
  return "Low";
}

function buildInsights(
  condition: ConditionKey,
  features: Features,
  profile: SignalProfile,
  confidence: number,
  risk: RiskLevel,
  topFeature: string,
) {
  const label = CONDITION_META[condition].label;
  const range = features.max - features.min;
  const measured = `${features.variance.toFixed(1)} variance, ${features.std.toFixed(2)} standard deviation, ${range.toFixed(1)} peak-to-peak amplitude, and ${profile.peakCount} abnormal peak${profile.peakCount === 1 ? "" : "s"}`;

  const patternByCondition: Record<ConditionKey, string> = {
    normal: `Signal stability is within the expected physiological range for this recording: ${measured}.`,
    insomnia: `Elevated variance indicates fragmented sleep architecture in this recording, with ${measured}.`,
    apnea: `Amplitude irregularities may indicate breathing-event patterns in this recording, with ${measured}.`,
    seizure: `Signal complexity indicates neurological abnormalities requiring further assessment, with ${measured}.`,
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
    risk: `The Random Forest model classified this recording as ${label} at ${confidence.toFixed(1)}% confidence. The strongest model contributor was ${topFeature}, with a measured instability index of ${profile.instability}/100.`,
    nextStep: nextStepByRisk[risk],
  };
}

function buildRecommendations(condition: ConditionKey, risk: RiskLevel, topFeature: string, features: Features, profile: SignalProfile) {
  const conditionSpecific: Record<ConditionKey, string[]> = {
    normal: [
      "Maintain healthy sleep hygiene with consistent sleep and wake times",
      "Continue regular exercise and daytime light exposure",
      "Use this stable signal window as a baseline for future comparison",
    ],
    insomnia: [
      "Reduce caffeine, especially later in the day",
      "Improve sleep hygiene with a predictable wind-down routine",
      "Consider CBT-I strategies if sleep disruption persists",
    ],
    apnea: [
      "Recommend a professional sleep study when symptoms match the screening pattern",
      "Consult a sleep specialist about breathing-related sleep disruption",
      "Track snoring, awakenings, oxygen concerns, or daytime fatigue patterns",
    ],
    seizure: [
      "Recommend urgent neurological evaluation for this abnormal signal pattern",
      "EEG confirmation is advised through qualified clinical testing",
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

  const measured =
    profile.peakCount > 0
      ? `Review the ${profile.peakCount} detected abnormal peak${profile.peakCount === 1 ? "" : "s"} and the ${topFeature.toLowerCase()} contribution in the report`
      : `Review the ${topFeature.toLowerCase()} contribution and the measured variance of ${features.variance.toFixed(1)} in the report`;

  return [measured, ...conditionSpecific[condition], riskSpecific[risk]];
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

/** Resamples the real uploaded signal to a fixed number of points for charting. */
function resampleSignal(source: number[], targetPoints = 400) {
  const clean = source.filter(Number.isFinite);
  if (clean.length <= 1) return clean.map((v) => round1(v));
  if (clean.length === targetPoints) return clean.map((v) => round1(v));
  const out: number[] = [];
  for (let i = 0; i < targetPoints; i++) {
    const pos = (i / (targetPoints - 1)) * (clean.length - 1);
    const left = Math.floor(pos);
    const right = Math.min(clean.length - 1, left + 1);
    const mix = pos - left;
    out.push(round1(clean[left] * (1 - mix) + clean[right] * mix));
  }
  return out;
}

function normalizeProbabilities(pred: BackendPrediction, condition: ConditionKey, confidence: number) {
  const p = pred.probabilities ?? {};
  const raw = {
    normal: Number(p.normal ?? 0),
    insomnia: Number(p.insomnia ?? 0),
    apnea: Number(p.apnea ?? 0),
    seizure: Number(p.seizure ?? 0),
  };
  const total = raw.normal + raw.insomnia + raw.apnea + raw.seizure;
  if (total <= 0) {
    const rest = round1((100 - confidence) / 3);
    const filled: Record<ConditionKey, number> = { normal: rest, insomnia: rest, apnea: rest, seizure: rest };
    filled[condition] = confidence;
    return filled;
  }

  const scale = 100 / total;
  const scaled: Record<ConditionKey, number> = {
    normal: round1(raw.normal * scale),
    insomnia: round1(raw.insomnia * scale),
    apnea: round1(raw.apnea * scale),
    seizure: round1(raw.seizure * scale),
  };
  scaled[condition] = confidence;
  const others = (Object.keys(scaled) as ConditionKey[]).filter((k) => k !== condition);
  const othersTotal = others.reduce((s, k) => s + scaled[k], 0);
  const target = round1(100 - confidence);
  if (othersTotal > 0) {
    const adj = target / othersTotal;
    others.forEach((k) => (scaled[k] = round1(scaled[k] * adj)));
  }
  const drift = round1(100 - (confidence + others.reduce((s, k) => s + scaled[k], 0)));
  const biggest = others.reduce((a, b) => (scaled[a] >= scaled[b] ? a : b));
  scaled[biggest] = round1(Math.max(0, scaled[biggest] + drift));
  return scaled;
}

function normalizeImportance(items: { name: string; value: number }[] | undefined) {
  const list = (items ?? []).filter((i) => Number.isFinite(i.value));
  if (!list.length) return [];
  const total = list.reduce((s, i) => s + i.value, 0) || 1;
  const rounded = list.map((i) => ({ name: i.name, value: round0((i.value / total) * 100) }));
  let drift = 100 - rounded.reduce((s, i) => s + i.value, 0);
  let cursor = 0;
  const order = [...rounded].sort((a, b) => b.value - a.value).map((i) => i.name);
  while (drift !== 0 && cursor < 200) {
    const item = rounded.find((x) => x.name === order[cursor % order.length]);
    if (item && (drift > 0 || item.value > 1)) {
      item.value += drift > 0 ? 1 : -1;
      drift += drift > 0 ? -1 : 1;
    }
    cursor += 1;
  }
  return rounded.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

/** Builds the report around the backend's classification and the file's measured signal. */
function buildResult(
  pred: BackendPrediction,
  features: Features,
  values: number[],
  sourceName: string,
  fingerprint: string,
): AnalysisResult {
  const condition = CONDITION_BY_ID[pred.condition_id as number] ?? "normal";
  const confidence = round1(clamp(Number(pred.confidence ?? 0), 0, 100));
  const probabilities = normalizeProbabilities(pred, condition, confidence);
  const signalSamples = resampleSignal(values);
  const signalProfile = analyzeSignalProfile(values, features);
  const featureImportance = normalizeImportance(pred.feature_importance);
  const topFeature = featureImportance[0]?.name ?? "Signal Variance";
  const riskIndex = riskIndexFor(condition, features, confidence, signalProfile);
  const risk = riskLevelFromIndex(riskIndex);
  const signalStability = round0(
    clamp(100 - normalize(features.std, 8, 52) * 58 - normalize(features.variance, 120, 2100) * 22, 18, 98),
  );
  const patternConsistency = round0(clamp(confidence * 0.62 + signalStability * 0.28 + (100 - riskIndex) * 0.1, 15, 98));
  const intelligenceScore = round0(clamp(signalStability * 0.32 + patternConsistency * 0.28 + (100 - riskIndex) * 0.4, 8, 96));

  const seedBase = hashString(`${sourceName}|${fingerprint}`);
  const now = new Date();
  const datePart = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const idSuffix = seedBase.toString(36).toUpperCase().padStart(7, "0").slice(-7);

  return {
    id: `SA-${datePart}-${idSuffix}`,
    timestamp: now.toISOString(),
    sourceName,
    condition,
    conditionLabel: pred.condition?.trim() || CONDITION_META[condition].label,
    confidence,
    risk,
    probabilities,
    features,
    featureImportance,
    intelligenceScore,
    signalStability,
    patternConsistency,
    riskIndex,
    insights: buildInsights(condition, features, signalProfile, confidence, risk, topFeature),
    recommendations: buildRecommendations(condition, risk, topFeature, features, signalProfile),
    waveformSeed: seedBase * 10 + CONDITION_INDEX[condition],
    signalSamples,
    signalProfile,
  };
}

/** Classification always comes from the Random Forest service — there is no offline fallback. */
export async function analyzeCSVFile(file: File): Promise<AnalysisResult> {
  const text = await file.text();
  const values = parseCSVNumbers(text);
  if (values.length < 8) {
    throw new Error("The uploaded file does not contain enough numeric samples to analyze.");
  }
  const features = computeFeatures(values);
  const fingerprint = `${values.length}|${hashString(values.map((v) => Number(v.toPrecision(12))).join(","))}`;
  const prediction = await predictWithBackend(file);
  return buildResult(prediction, features, values, file.name, fingerprint);
}

/** Manual feature entry is sent to the same model as a single-row feature CSV. */
export async function analyzeFeatures(features: Features): Promise<AnalysisResult> {
  const csv = `mean,std,var,min,max\n${features.mean},${features.std},${features.variance},${features.min},${features.max}\n`;
  const file = new File([csv], "manual-entry.csv", { type: "text/csv" });
  const prediction = await predictWithBackend(file);
  const values = [features.min, features.mean, features.max, features.mean, features.min, features.max, features.mean, features.max];
  const fingerprint = `manual|${features.mean}|${features.std}|${features.variance}|${features.min}|${features.max}`;
  return buildResult(prediction, features, values, "Manual feature entry", fingerprint);
}
