import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Trees, Layers, AlertTriangle, RefreshCw, Cpu } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { CONDITION_HEX, type ConditionKey } from "@/lib/analysis-types";
import { fetchModelInfo, ML_API_BASE, type ModelInfo } from "@/lib/ml-api";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Model Intelligence Lab — SOMNIA AI" },
      { name: "description", content: "Live Random Forest metrics: accuracy, precision, recall, F1 and the confusion matrix from the trained model." },
      { property: "og:title", content: "Model Intelligence Lab — SOMNIA AI" },
      { property: "og:description", content: "Live Random Forest metrics read directly from the trained model artifact." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

const LABEL_TO_KEY: Record<string, ConditionKey> = {
  Normal: "normal",
  Insomnia: "insomnia",
  "Sleep Apnea": "apnea",
  Seizure: "seizure",
  "Seizure Activity": "seizure",
};

function hexFor(label: string) {
  return CONDITION_HEX[LABEL_TO_KEY[label] ?? "normal"] ?? "#22d3ee";
}

function AnalyticsPage() {
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setModel(await fetchModelInfo());
    } catch (err) {
      setModel(null);
      setError(err instanceof Error ? err.message : "Unable to reach the analysis engine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const evaluation = model?.evaluation ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Model Intelligence</div>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Model Intelligence Lab</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every figure below is read from the trained Random Forest artifact and its evaluation run — nothing here is illustrative.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </motion.div>

      {error && (
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-status-critical/40 bg-status-critical/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-critical" />
          <div>
            <div className="font-medium text-status-critical">Model metrics unavailable</div>
            <p className="mt-1 text-muted-foreground">
              {error} Start the service with <code className="font-mono text-foreground">uvicorn backend.app:app --port 8000</code> or point{" "}
              <code className="font-mono text-foreground">VITE_ML_API_URL</code> at your hosted API. Target:{" "}
              <span className="font-mono text-foreground">{ML_API_BASE}</span>
            </p>
          </div>
        </div>
      )}

      {loading && !model && <div className="mt-10 text-sm text-muted-foreground">Reading model artifact…</div>}

      {model && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Cpu, k: "Algorithm", v: model.model_type },
              { icon: Trees, k: "Decision Trees", v: String(model.n_estimators) },
              { icon: Layers, k: "Input Features", v: String(model.n_features) },
              { icon: BarChart3, k: "Total Nodes", v: model.total_nodes != null ? model.total_nodes.toLocaleString() : "—" },
            ].map((s) => (
              <div key={s.k} className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <s.icon className="h-3.5 w-3.5 text-accent-cyan" /> {s.k}
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">{s.v}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="glass-card rounded-2xl p-6">
              <div className="text-sm font-semibold">Feature Importance</div>
              <p className="mt-1 text-xs text-muted-foreground">Gini importance from the trained forest, normalized to 100%.</p>
              <div className="mt-5 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={model.feature_importance} layout="vertical" margin={{ left: 24, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} unit="%" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis type="category" dataKey="name" width={140} stroke="var(--muted-foreground)" fontSize={11} />
                    <RTooltip
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => [`${v}%`, "Importance"]}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="var(--accent-cyan)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="text-sm font-semibold">Model Structure</div>
              <p className="mt-1 text-xs text-muted-foreground">Ensemble geometry inspected from the serialized estimator.</p>
              <dl className="mt-5 grid gap-3 text-sm">
                {[
                  ["Maximum tree depth", model.max_tree_depth != null ? String(model.max_tree_depth) : "—"],
                  ["Average tree depth", model.avg_tree_depth != null ? model.avg_tree_depth.toFixed(1) : "—"],
                  ["Output classes", String(model.classes.length)],
                  ["Feature vector", model.feature_names.join(", ")],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-6 border-b border-border/60 pb-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-mono text-xs">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                {model.classes.map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                    style={{ borderColor: `${hexFor(c.label)}55`, background: `${hexFor(c.label)}14`, color: hexFor(c.label) }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: hexFor(c.label) }} />
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {evaluation ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Accuracy", evaluation.accuracy],
                  ["Precision", evaluation.precision],
                  ["Recall", evaluation.recall],
                  ["F1 Score", evaluation.f1],
                ].map(([k, v]) => (
                  <div key={k as string} className="glass-card rounded-2xl p-5">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k as string}</div>
                    <div className="mt-2 text-3xl font-semibold tabular-nums text-accent-cyan">
                      {((v as number) * 100).toFixed(1)}%
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue" style={{ width: `${(v as number) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="glass-card rounded-2xl p-6">
                  <div className="text-sm font-semibold">Confusion Matrix</div>
                  <p className="mt-1 text-xs text-muted-foreground">{evaluation.samples_evaluated.toLocaleString()} evaluation samples · rows are true labels.</p>
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="p-2" />
                          {evaluation.labels.map((l) => (
                            <th key={l} className="p-2 font-medium text-muted-foreground">{l}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {evaluation.confusion_matrix.map((row, i) => {
                          const rowTotal = row.reduce((s, v) => s + v, 0) || 1;
                          return (
                            <tr key={evaluation.labels[i]}>
                              <td className="p-2 text-right font-medium text-muted-foreground whitespace-nowrap">{evaluation.labels[i]}</td>
                              {row.map((v, j) => {
                                const intensity = v / rowTotal;
                                return (
                                  <td key={j} className="p-1">
                                    <div
                                      className="grid h-12 place-items-center rounded-lg border font-mono tabular-nums"
                                      style={{
                                        background: i === j ? `rgba(34,211,238,${0.08 + intensity * 0.42})` : `rgba(239,68,68,${intensity * 0.35})`,
                                        borderColor: i === j ? "rgba(34,211,238,0.35)" : "var(--border)",
                                      }}
                                    >
                                      {v}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <div className="text-sm font-semibold">Per-Class Performance</div>
                  <p className="mt-1 text-xs text-muted-foreground">Precision, recall and F1 measured per condition.</p>
                  <div className="mt-5 space-y-4">
                    {evaluation.per_class.map((c) => (
                      <div key={c.label}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: hexFor(c.label) }} />
                            {c.label}
                            <span className="text-muted-foreground">· {c.support} samples</span>
                          </span>
                          <span className="font-mono">{(c.f1 * 100).toFixed(1)}% F1</span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-2 gap-2">
                          {[["Precision", c.precision], ["Recall", c.recall]].map(([k, v]) => (
                            <div key={k as string}>
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>{k as string}</span>
                                <span className="font-mono">{((v as number) * 100).toFixed(1)}%</span>
                              </div>
                              <div className="mt-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(v as number) * 100}%`, background: hexFor(c.label) }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {evaluation.class_distribution.length > 0 && (
                    <div className="mt-6 border-t border-border/60 pt-5">
                      <div className="text-xs font-semibold">Evaluation Set Distribution</div>
                      <div className="mt-3 h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={evaluation.class_distribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="condition" stroke="var(--muted-foreground)" fontSize={10} />
                            <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                            <RTooltip
                              cursor={{ fill: "rgba(255,255,255,0.04)" }}
                              contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                            />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                              {evaluation.class_distribution.map((d) => (
                                <Cell key={d.condition} fill={hexFor(d.condition)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6 glass-card rounded-2xl p-6 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">No evaluation metrics recorded yet</div>
              <p className="mt-1">
                Accuracy, precision, recall and the confusion matrix are only shown when the model has been evaluated against a held-out
                set. Run <code className="font-mono text-foreground">python backend/serialize.py</code> with your training data to generate{" "}
                <code className="font-mono text-foreground">backend/models/metrics.json</code>. No placeholder scores are displayed here.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
