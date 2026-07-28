export type ConditionKey = "normal" | "insomnia" | "apnea" | "seizure";
export type RiskLevel = "Low" | "Medium" | "Moderate" | "High" | "Critical";

export interface Features {
  mean: number;
  std: number;
  variance: number;
  min: number;
  max: number;
}

export interface Probabilities {
  normal: number;
  insomnia: number;
  apnea: number;
  seizure: number;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  condition: ConditionKey;
  conditionLabel: string;
  confidence: number;
  risk: RiskLevel;
  probabilities: Probabilities;
  features: Features;
  featureImportance: { name: string; value: number }[];
  intelligenceScore: number;
  signalStability: number;
  patternConsistency: number;
  riskIndex: number;
  insights: { pattern: string; risk: string; nextStep: string };
  recommendations: string[];
  waveformSeed: number;
  signalSamples: number[];
  signalProfile: {
    sampleCount: number;
    peakCount: number;
    zeroCrossings: number;
    peakToPeak: number;
    volatility: number;
    instability: number;
    asymmetry: number;
  };
}

export const CONDITION_META: Record<ConditionKey, { label: string; color: string; description: string }> = {
  normal: {
    label: "Normal Sleep",
    color: "var(--status-normal)",
    description: "Patterns that do not indicate the screened abnormalities.",
  },
  insomnia: {
    label: "Insomnia",
    color: "var(--status-moderate)",
    description: "Patterns potentially associated with disrupted or insufficient sleep.",
  },
  apnea: {
    label: "Sleep Apnea",
    color: "var(--status-high)",
    description: "Patterns potentially associated with sleep-related breathing disturbances.",
  },
  seizure: {
    label: "Seizure Activity",
    color: "var(--status-critical)",
    description: "Patterns potentially associated with abnormal neurological signal activity.",
  },
};

export const MODEL_METRICS = [
  { model: "Random Forest", accuracy: 92.4, precision: 91.8, recall: 92.1, f1: 91.9, primary: true },
  { model: "SVM", accuracy: 87.6, precision: 86.9, recall: 87.2, f1: 87.0 },
  { model: "Logistic Regression", accuracy: 82.1, precision: 81.4, recall: 82.0, f1: 81.7 },
];

export const CONFUSION_MATRIX = {
  labels: ["Normal", "Insomnia", "Sleep Apnea", "Seizure"],
  // rows = actual, cols = predicted
  data: [
    [148, 4, 3, 1],
    [5, 132, 6, 2],
    [3, 5, 141, 2],
    [1, 2, 3, 139],
  ],
};

export const DATASET_DISTRIBUTION = [
  { condition: "Normal", count: 156, pct: 26.3 },
  { condition: "Insomnia", count: 145, pct: 24.5 },
  { condition: "Sleep Apnea", count: 151, pct: 25.5 },
  { condition: "Seizure", count: 141, pct: 23.8 },
];

export const HISTORY_RECORDS: Array<{
  id: string;
  date: string;
  condition: ConditionKey;
  confidence: number;
  risk: RiskLevel;
}> = [
  { id: "SA-2026-0718-001", date: "2026-07-18", condition: "apnea", confidence: 91.4, risk: "Moderate" },
  { id: "SA-2026-0712-002", date: "2026-07-12", condition: "normal", confidence: 94.2, risk: "Low" },
  { id: "SA-2026-0704-003", date: "2026-07-04", condition: "insomnia", confidence: 87.6, risk: "Medium" },
  { id: "SA-2026-0628-004", date: "2026-06-28", condition: "normal", confidence: 96.1, risk: "Low" },
  { id: "SA-2026-0615-005", date: "2026-06-15", condition: "seizure", confidence: 93.5, risk: "Critical" },
  { id: "SA-2026-0602-006", date: "2026-06-02", condition: "apnea", confidence: 89.2, risk: "Moderate" },
];

export const RISK_COLOR: Record<RiskLevel, string> = {
  Low: "var(--status-normal)",
  Medium: "var(--status-moderate)",
  Moderate: "var(--status-high)",
  High: "var(--status-high)",
  Critical: "var(--status-critical)",
};

// Deterministic waveform generator (seeded)
export function generateWaveform(seed: number, points = 400): number[] {
  const out: number[] = [];
  // simple LCG
  const normalizedSeed = Math.abs(Math.trunc(seed)) % 1_000_000;
  let s = normalizedSeed * 9973 + 12345;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s / 0xffffffff) * 2 - 1;
  };
  const conditionSeed = seed >= 10 ? Math.abs(seed) % 10 : seed;
  const amp = conditionSeed === 4 ? 60 : conditionSeed === 3 ? 34 : conditionSeed === 2 ? 24 : 14;
  const spike = conditionSeed === 4;
  const disruption = conditionSeed === 3;
  for (let i = 0; i < points; i++) {
    const t = i / points;
    let v =
      Math.sin(t * Math.PI * 20 + seed) * amp * 0.55 +
      Math.sin(t * Math.PI * 60 + seed * 2) * amp * 0.25 +
      Math.sin(t * Math.PI * 8) * amp * 0.35 +
      rnd() * amp * 0.15;
    if (spike && (i % 47 === 0 || i % 53 === 0)) v += rnd() * amp * 1.6;
    if (disruption && i % 68 > 48) v *= 0.38 + Math.abs(rnd()) * 0.24;
    out.push(v);
  }
  return out;
}
