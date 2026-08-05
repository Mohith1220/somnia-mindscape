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
  sourceName: string;
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

export const RISK_COLOR: Record<RiskLevel, string> = {
  Low: "var(--status-normal)",
  Medium: "var(--status-moderate)",
  Moderate: "var(--status-high)",
  High: "var(--status-high)",
  Critical: "var(--status-critical)",
};

export const CONDITION_HEX: Record<ConditionKey, string> = {
  normal: "#4ade80",
  insomnia: "#facc15",
  apnea: "#fb923c",
  seizure: "#ef4444",
};

export const RISK_HEX: Record<RiskLevel, string> = {
  Low: "#4ade80",
  Medium: "#facc15",
  Moderate: "#fb923c",
  High: "#f97316",
  Critical: "#ef4444",
};
