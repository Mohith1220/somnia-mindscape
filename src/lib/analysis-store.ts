import { create } from "zustand";
import { DEMO_SCENARIOS, type AnalysisResult, type ConditionKey } from "./demo-data";

interface AnalysisState {
  currentResult: AnalysisResult | null;
  selectedDemo: ConditionKey;
  setDemo: (k: ConditionKey) => void;
  runAnalysis: (k?: ConditionKey) => AnalysisResult;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentResult: null,
  selectedDemo: "apnea",
  setDemo: (k) => set({ selectedDemo: k }),
  runAnalysis: (k) => {
    const key = k ?? get().selectedDemo;
    const result = { ...DEMO_SCENARIOS[key], timestamp: new Date().toISOString() };
    set({ currentResult: result, selectedDemo: key });
    return result;
  },
  reset: () => set({ currentResult: null }),
}));
