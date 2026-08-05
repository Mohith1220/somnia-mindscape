import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AnalysisResult } from "./analysis-types";

export interface HistoryEntry {
  id: string;
  timestamp: string;
  sourceName: string;
  condition: AnalysisResult["condition"];
  confidence: number;
  risk: AnalysisResult["risk"];
  result: AnalysisResult;
}

interface AnalysisState {
  currentResult: AnalysisResult | null;
  history: HistoryEntry[];
  setResult: (r: AnalysisResult) => void;
  openFromHistory: (id: string) => void;
  clearHistory: () => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      currentResult: null,
      history: [],
      setResult: (r) =>
        set((s) => ({
          currentResult: r,
          history: [
            {
              id: r.id,
              timestamp: r.timestamp,
              sourceName: r.sourceName,
              condition: r.condition,
              confidence: r.confidence,
              risk: r.risk,
              result: r,
            },
            ...s.history.filter((h) => h.id !== r.id),
          ].slice(0, 50),
        })),
      openFromHistory: (id) => {
        const entry = get().history.find((h) => h.id === id);
        if (entry) set({ currentResult: entry.result });
      },
      clearHistory: () => set({ history: [] }),
      reset: () => set({ currentResult: null }),
    }),
    {
      name: "somnia-analysis",
      version: 3,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      partialize: (s) => ({ currentResult: s.currentResult, history: s.history }),
      migrate: (persisted, version) => {
        const state = persisted as Partial<AnalysisState> | undefined;
        if (version < 3) return { currentResult: null, history: [] };
        const result = state?.currentResult;
        return {
          currentResult: result?.signalSamples?.length && result.signalProfile ? result : null,
          history: (state?.history ?? []).filter((h) => h?.result?.signalSamples?.length),
        };
      },
    },
  ),
);
