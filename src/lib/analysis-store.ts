import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AnalysisResult } from "./demo-data";

interface AnalysisState {
  currentResult: AnalysisResult | null;
  setResult: (r: AnalysisResult) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      currentResult: null,
      setResult: (r) => set({ currentResult: r }),
      reset: () => set({ currentResult: null }),
    }),
    {
      name: "somnia-analysis",
      version: 2,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      partialize: (s) => ({ currentResult: s.currentResult }),
      migrate: (persisted) => {
        const state = persisted as Partial<AnalysisState> | undefined;
        const result = state?.currentResult;
        if (!result?.signalSamples?.length || !result.signalProfile) {
          return { currentResult: null, setResult: (r: AnalysisResult) => ({ currentResult: r }), reset: () => ({ currentResult: null }) } as unknown as AnalysisState;
        }
        return state as AnalysisState;
      },
    },
  ),
);
