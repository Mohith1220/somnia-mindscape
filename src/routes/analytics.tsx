import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Award, Target, Boxes, Layers } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, Legend, Cell,
  PieChart, Pie,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CONFUSION_MATRIX, DATASET_DISTRIBUTION, MODEL_METRICS } from "@/lib/demo-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Model Intelligence Lab — SOMNIA AI" },
      { name: "description", content: "Explore model performance, classification metrics, and evaluation results across Random Forest, SVM, and Logistic Regression." },
    ],
  }),
  component: AnalyticsPage,
});

const METRICS = ["accuracy", "precision", "recall", "f1"] as const;
type MetricKey = typeof METRICS[number];
const METRIC_LABEL: Record<MetricKey, string> = { accuracy: "Accuracy", precision: "Precision", recall: "Recall", f1: "F1 Score" };
const COLORS = ["var(--status-normal)", "var(--status-moderate)", "var(--status-high)", "var(--status-critical)"];

function AnalyticsPage() {
  const [metric, setMetric] = useState<MetricKey>("accuracy");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Model Analytics</div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Model Intelligence Lab</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Explore model performance, classification metrics, and evaluation results.
        </p>
      </motion.div>

      {/* Top KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI icon={Award} label="Best Performing Model" value="Random Forest" hint="Highest accuracy across all metrics" accent="var(--accent-cyan)" />
        <KPI icon={Target} label="Reported Project Accuracy" value="92.4%" hint="Source: project documentation" accent="var(--status-normal)" />
        <KPI icon={Boxes} label="Models Evaluated" value="3" hint="RF · SVM · Logistic Regression" accent="var(--accent-blue)" />
        <KPI icon={Layers} label="Detection Classes" value="4" hint="Normal · Insomnia · Apnea · Seizure" accent="var(--status-moderate)" />
      </div>

      {/* Model comparison */}
      <div className="mt-8 glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Comparison</div>
            <h2 className="mt-1 text-xl font-semibold">Model Performance Comparison</h2>
            <p className="text-sm text-muted-foreground mt-1">Interactive comparison across the three evaluated classifiers.</p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface/60 p-1">
            {METRICS.map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  metric === m ? "bg-accent-cyan/15 text-accent-cyan" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {METRIC_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MODEL_METRICS} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="model" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis domain={[70, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} unit="%" />
              <RTooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v}%`, METRIC_LABEL[metric]]}
              />
              <Bar dataKey={metric} radius={[8, 8, 0, 0]}>
                {MODEL_METRICS.map((m, i) => (
                  <Cell key={i} fill={m.primary ? "var(--accent-cyan)" : "var(--accent-blue)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Values shown on a truncated 70–100% scale for visual clarity. Random Forest is designated as the primary classification model.
        </div>
      </div>

      {/* Confusion matrix & distribution */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Classification</div>
          <h2 className="mt-1 text-xl font-semibold">Confusion Matrix</h2>
          <p className="text-sm text-muted-foreground mt-1">Random Forest — actual vs. predicted class counts.</p>
          <ConfusionMatrix />
          <div className="mt-3 text-xs text-muted-foreground">
            The confusion matrix compares actual classifications with model predictions and helps identify where classification errors occur.
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Dataset</div>
          <h2 className="mt-1 text-xl font-semibold">Detected Condition Distribution</h2>
          <p className="text-sm text-muted-foreground mt-1">Composition of the evaluation dataset used to assess model performance.</p>
          <div className="mt-4 grid grid-cols-2 items-center gap-6">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={DATASET_DISTRIBUTION} dataKey="count" nameKey="condition" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {DATASET_DISTRIBUTION.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} stroke="var(--background)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2 text-sm">
              {DATASET_DISTRIBUTION.map((d, i) => (
                <li key={d.condition} className="flex items-center justify-between rounded-md bg-surface/40 border border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
                    <span>{d.condition}</span>
                  </div>
                  <div className="text-xs font-mono">
                    <span className="text-muted-foreground">{d.count}</span> · <span className="text-foreground">{d.pct}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, hint, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint: string; accent: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold">{value}</div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-lg border" style={{ color: accent, background: `${accent}18`, borderColor: `${accent}40` }}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{hint}</div>
    </motion.div>
  );
}

function ConfusionMatrix() {
  const { labels, data } = CONFUSION_MATRIX;
  const max = Math.max(...data.flat());
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-2 text-muted-foreground text-left font-medium">Actual \ Pred</th>
            {labels.map((l) => <th key={l} className="p-2 text-muted-foreground font-medium">{l}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td className="p-2 text-muted-foreground font-medium">{labels[i]}</td>
              {row.map((v, j) => {
                const intensity = v / max;
                const diagonal = i === j;
                const bg = diagonal
                  ? `color-mix(in oklch, var(--status-normal) ${Math.round(intensity * 55)}%, transparent)`
                  : `color-mix(in oklch, var(--status-critical) ${Math.round(intensity * 55)}%, transparent)`;
                return (
                  <td key={j} className="p-1">
                    <div
                      title={`${labels[i]} predicted as ${labels[j]}: ${v}`}
                      className="rounded-md border border-border/50 p-3 text-center font-mono cursor-default hover:border-accent-cyan/60 transition-colors"
                      style={{ background: bg }}
                    >
                      <div className="text-sm font-semibold">{v}</div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
