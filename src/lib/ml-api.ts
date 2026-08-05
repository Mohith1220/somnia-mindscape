import type { ConditionKey } from "./analysis-types";

/** Base URL of the FastAPI Random Forest service. */
export const ML_API_BASE = (
  (import.meta.env["VITE_ML_API_URL"] as string | undefined) ?? "http://localhost:8000"
).replace(/\/+$/, "").replace(/\/predict$/, "");

export const CONDITION_BY_ID: Record<number, ConditionKey> = {
  0: "normal",
  1: "insomnia",
  2: "apnea",
  3: "seizure",
};

export interface BackendPrediction {
  success?: boolean;
  condition?: string;
  condition_id?: number;
  confidence?: number;
  probabilities?: Partial<Record<ConditionKey, number>>;
  feature_importance?: { name: string; value: number }[];
  windows_analyzed?: number;
}

export interface ModelInfo {
  model_type: string;
  n_estimators: number;
  n_features: number;
  feature_names: string[];
  classes: { id: number; label: string }[];
  max_tree_depth: number | null;
  avg_tree_depth: number | null;
  total_nodes: number | null;
  feature_importance: { name: string; value: number }[];
  evaluation: {
    model: string;
    samples_evaluated: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    labels: string[];
    per_class: { label: string; precision: number; recall: number; f1: number; support: number }[];
    confusion_matrix: number[][];
    class_distribution: { condition: string; count: number; pct: number }[];
  } | null;
}

export class BackendUnavailableError extends Error {
  constructor(message = "The analysis engine is not reachable. Start the Random Forest service and try again.") {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${ML_API_BASE}${path}`, { ...init, signal: controller.signal });
  } catch {
    throw new BackendUnavailableError();
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = `Analysis engine returned ${res.status}.`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      /* keep default */
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

/** Sends the file to the Random Forest service. Throws when unreachable — there is no local fallback. */
export async function predictWithBackend(file: File): Promise<BackendPrediction> {
  const form = new FormData();
  form.append("file", file);
  const json = await request<BackendPrediction>("/predict", { method: "POST", body: form });
  if (json?.success === false || typeof json?.condition_id !== "number") {
    throw new Error("The analysis engine could not classify this file.");
  }
  return json;
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  return request<ModelInfo>("/model/info", { method: "GET" }, 10000);
}

export async function fetchHealth(): Promise<{ status: string; model_loaded: boolean }> {
  return request("/health", { method: "GET" }, 5000);
}
