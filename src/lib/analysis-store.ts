import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEMO_SCENARIOS, type AnalysisResult, type ConditionKey } from "./demo-data";

interface AnalysisState {
  currentResult: AnalysisResult | null;
  selectedDemo: ConditionKey;
  setDemo: (k: ConditionKey) => void;
  runAnalysis: (k?: ConditionKey) => AnalysisResult;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      currentResult: null,
      selectedDemo: "apnea",
      setDemo: (k) => set({ selectedDemo: k }),
      runAnalysis: (k) => {
        const key = k ?? get().selectedDemo;
        // Use a deterministic timestamp for SSR-safety; refresh only in the browser.
        const ts =
          typeof window !== "undefined"
            ? new Date().toISOString()
            : DEMO_SCENARIOS[key].timestamp;
        const result = { ...DEMO_SCENARIOS[key], timestamp: ts };
        set({ currentResult: result, selectedDemo: key });
        return result;
      },
      reset: () => set({ currentResult: null }),
    }),
    {
      name: "somnia-analysis",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      partialize: (s) => ({ currentResult: s.currentResult, selectedDemo: s.selectedDemo }),
    },
  ),
);
