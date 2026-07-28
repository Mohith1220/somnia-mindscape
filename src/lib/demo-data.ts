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

const DEMO_TIMESTAMP = "2026-07-18T09:00:00.000Z";

export const DEMO_SCENARIOS: Record<ConditionKey, AnalysisResult> = {
  normal: {
    id: "SA-2026-0718-100",
    timestamp: DEMO_TIMESTAMP,
    condition: "normal",
    conditionLabel: "Normal Sleep",
    confidence: 96.1,
    risk: "Low",
    probabilities: { normal: 92.4, insomnia: 4.8, apnea: 2.1, seizure: 0.7 },
    features: { mean: 0.021, std: 12.34, variance: 152.3, min: -48.6, max: 51.2 },
    featureImportance: [
      { name: "Signal Variance", value: 28 },
      { name: "Maximum Amplitude", value: 22 },
      { name: "Standard Deviation", value: 20 },
      { name: "Minimum Amplitude", value: 18 },
      { name: "Mean", value: 12 },
    ],
    intelligenceScore: 88,
    signalStability: 93,
    patternConsistency: 90,
    riskIndex: 12,
    insights: {
      pattern: "The analyzed signal exhibits stable oscillatory behavior consistent with restful neural activity.",
      risk: "The model did not identify strong markers of the screened sleep or neurological abnormalities.",
      nextStep: "Continue maintaining healthy sleep habits and periodic wellness screening.",
    },
    recommendations: [
      "Maintain consistent sleep and wake times",
      "Continue balanced physical activity",
      "Limit stimulants before bedtime",
      "Prioritize 7–9 hours of nightly rest",
      "Schedule periodic wellness checkups",
    ],
    waveformSeed: 1,
  },
  insomnia: {
    id: "SA-2026-0718-101",
    timestamp: DEMO_TIMESTAMP,
    condition: "insomnia",
    conditionLabel: "Insomnia",
    confidence: 88.7,
    risk: "Medium",
    probabilities: { normal: 6.4, insomnia: 88.7, apnea: 3.2, seizure: 1.7 },
    features: { mean: 0.084, std: 18.72, variance: 350.4, min: -62.1, max: 68.9 },
    featureImportance: [
      { name: "Standard Deviation", value: 30 },
      { name: "Signal Variance", value: 26 },
      { name: "Maximum Amplitude", value: 20 },
      { name: "Minimum Amplitude", value: 14 },
      { name: "Mean", value: 10 },
    ],
    intelligenceScore: 62,
    signalStability: 68,
    patternConsistency: 71,
    riskIndex: 42,
    insights: {
      pattern: "The signal shows elevated variability consistent with fragmented sleep patterns.",
      risk: "The model identified patterns associated with Insomnia with moderate prediction confidence.",
      nextStep: "Consider discussing sleep hygiene and possible evaluation with a healthcare professional.",
    },
    recommendations: [
      "Establish a consistent bedtime routine",
      "Reduce screen exposure before sleep",
      "Limit caffeine after mid-afternoon",
      "Try relaxation or breathing exercises",
      "Consult a sleep specialist if symptoms persist",
    ],
    waveformSeed: 2,
  },
  apnea: {
    id: "SA-2026-0718-001",
    timestamp: DEMO_TIMESTAMP,
    condition: "apnea",
    conditionLabel: "Sleep Apnea",
    confidence: 91.4,
    risk: "Moderate",
    probabilities: { normal: 3.2, insomnia: 4.1, apnea: 91.4, seizure: 1.3 },
    features: { mean: 0.42, std: 24.60, variance: 605.7, min: -78.3, max: 82.9 },
    featureImportance: [
      { name: "Signal Variance", value: 31 },
      { name: "Maximum Amplitude", value: 24 },
      { name: "Standard Deviation", value: 21 },
      { name: "Minimum Amplitude", value: 15 },
      { name: "Mean", value: 9 },
    ],
    intelligenceScore: 68,
    signalStability: 82,
    patternConsistency: 74,
    riskIndex: 28,
    insights: {
      pattern: "The analyzed signal demonstrates characteristics associated with disrupted sleep stability.",
      risk: "The model identified patterns associated with Sleep Apnea with high prediction confidence.",
      nextStep: "Consider discussing this screening result with a qualified healthcare or sleep specialist for appropriate clinical evaluation.",
    },
    recommendations: [
      "Maintain healthy sleep habits",
      "Consider side sleeping when appropriate",
      "Maintain a healthy lifestyle and weight",
      "Avoid sleep deprivation",
      "Consider professional sleep evaluation",
    ],
    waveformSeed: 3,
  },
  seizure: {
    id: "SA-2026-0718-102",
    timestamp: DEMO_TIMESTAMP,
    condition: "seizure",
    conditionLabel: "Seizure Activity",
    confidence: 94.8,
    risk: "Critical",
    probabilities: { normal: 1.6, insomnia: 1.9, apnea: 1.7, seizure: 94.8 },
    features: { mean: 0.312, std: 42.18, variance: 1779.2, min: -142.5, max: 156.8 },
    featureImportance: [
      { name: "Maximum Amplitude", value: 34 },
      { name: "Signal Variance", value: 28 },
      { name: "Minimum Amplitude", value: 18 },
      { name: "Standard Deviation", value: 14 },
      { name: "Mean", value: 6 },
    ],
    intelligenceScore: 34,
    signalStability: 41,
    patternConsistency: 38,
    riskIndex: 82,
    insights: {
      pattern: "The signal exhibits high-amplitude spike-and-wave characteristics associated with abnormal neurological activity.",
      risk: "The model identified strong patterns associated with Seizure Activity with very high prediction confidence.",
      nextStep: "Seek prompt evaluation by a qualified neurologist or medical professional.",
    },
    recommendations: [
      "Seek prompt medical consultation",
      "Avoid activities that could pose risk during unexpected events",
      "Track symptom occurrence and duration",
      "Maintain medication compliance if prescribed",
      "Ensure a supportive care network is aware",
    ],
    waveformSeed: 4,
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
  let s = seed * 9973 + 12345;
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
