import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Download, Printer, RotateCw, Brain, AlertCircle, TrendingUp, Shield,
  Waves, Activity, ZoomIn, ZoomOut, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAnalysisStore } from "@/lib/analysis-store";
import { CONDITION_META, generateWaveform } from "@/lib/demo-data";
import { EEGWave } from "@/components/eeg-wave";
import { CommandCenter } from "@/components/command-center";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, Cell,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Health Intelligence Report — SOMNIA AI" },
      { name: "description", content: "AI-generated screening report with class probabilities, feature importance, and health insights." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const navigate = useNavigate();
  const { currentResult, reset } = useAnalysisStore();
  const [displayDate, setDisplayDate] = useState<string>("");

  // Redirect back to /analysis if no analysis has been run yet.
  useEffect(() => {
    if (!currentResult) navigate({ to: "/analysis" });
  }, [currentResult, navigate]);

  useEffect(() => {
    if (currentResult) setDisplayDate(new Date(currentResult.timestamp).toLocaleString());
  }, [currentResult]);

  const result = currentResult;

  const probData = useMemo(() => {
    if (!result) return [];
    return [
      { name: "Normal", key: "normal", value: result.probabilities.normal, color: "var(--status-normal)" },
      { name: "Insomnia", key: "insomnia", value: result.probabilities.insomnia, color: "var(--status-moderate)" },
      { name: "Sleep Apnea", key: "apnea", value: result.probabilities.apnea, color: "var(--status-high)" },
      { name: "Seizure Activity", key: "seizure", value: result.probabilities.seizure, color: "var(--status-critical)" },
    ];
  }, [result]);

  const [zoom, setZoom] = useState(1);
  const [signalMode, setSignalMode] = useState<"raw" | "processed" | "feature">("raw");

  const waveform = useMemo(
    () => (result ? generateWaveform(result.waveformSeed, 400) : []),
    [result],
  );

  if (!result) return null;

  const conditionMeta = CONDITION_META[result.condition];

  const handleNew = () => {
    reset();
    navigate({ to: "/analysis" });
  };
  const handleDownload = () => {
    import("@/lib/report").then(({ downloadReport }) => {
      downloadReport(result);
      toast.success("Report downloaded");
    });
  };
  const handlePrint = () => {
    import("@/lib/report").then(({ openReport }) => {
      openReport(result, true);
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Intelligence Report</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">AI Health Intelligence Report</h1>
          <div className="mt-2 text-sm text-muted-foreground max-w-xl">
            Machine learning-assisted analysis of EEG-derived neural signal patterns.
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground font-mono">
            <span>ID <span className="text-foreground">{result.id}</span></span>
            <span suppressHydrationWarning>{displayDate || "\u00A0"}</span>
            <span>Type <span className="text-foreground">EEG Feature Analysis</span></span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-status-normal animate-pulse" /> Analysis Complete
            </span>
            {isDemo && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-accent-cyan">
                Demo Analysis
              </span>
            )}
          </div>
        </motion.div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handleDownload}><Download className="h-3.5 w-3.5 mr-1.5" />Download</Button>
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-3.5 w-3.5 mr-1.5" />Print</Button>
          <Button size="sm" onClick={handleNew} className="bg-accent-cyan text-primary-foreground hover:bg-accent-cyan/90"><RotateCw className="h-3.5 w-3.5 mr-1.5" />New Analysis</Button>
        </div>
      </div>

      {/* Demo scenario explorer */}
      <div className="mt-6 print:hidden glass-card rounded-2xl p-3 sm:p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-accent-cyan">Demo Scenario Explorer</span>
          <span className="text-muted-foreground hidden sm:inline">— switch context to see the report update instantly.</span>
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface/60 p-1">
          {(["normal", "insomnia", "apnea", "seizure"] as const).map((k) => {
            const active = result.condition === k;
            const c = CONDITION_META[k].color;
            return (
              <button
                key={k}
                onClick={() => cycleDemo(k)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  active
                    ? "bg-accent-cyan/15 text-accent-cyan"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                {CONDITION_META[k].label}
              </button>
            );
          })}
        </div>
      </div>


      {/* Neural Intelligence Command Center */}
      <CommandCenter result={result} />


      {/* Signal Explorer */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="mt-6 glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Signal Explorer</div>
            <h2 className="mt-1 text-xl font-semibold">Neural Signal Explorer</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}><ZoomOut className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}><ZoomIn className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(1)}><Home className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        <Tabs value={signalMode} onValueChange={(v) => setSignalMode(v as typeof signalMode)} className="mt-4">
          <TabsList className="bg-surface/70">
            <TabsTrigger value="raw">Raw Signal</TabsTrigger>
            <TabsTrigger value="processed">Processed Signal</TabsTrigger>
            <TabsTrigger value="feature">Feature Analysis</TabsTrigger>
          </TabsList>
          <TabsContent value="raw" className="mt-4">
            <SignalChart data={waveform} zoom={zoom} color={conditionMeta.color} />
          </TabsContent>
          <TabsContent value="processed" className="mt-4">
            <SignalChart data={waveform.map((v, i) => (v + waveform[Math.max(0, i - 1)]) / 2)} zoom={zoom} color="var(--accent-blue)" smoothed />
          </TabsContent>
          <TabsContent value="feature" className="mt-4">
            <FeatureBands features={result.features} />
          </TabsContent>
        </Tabs>

        <div className="mt-6 grid gap-3 grid-cols-2 md:grid-cols-5">
          {[
            { k: "Mean", v: result.features.mean.toFixed(3), ref: "-0.5 – 0.5" },
            { k: "Std Dev", v: result.features.std.toFixed(2), ref: "10 – 20" },
            { k: "Variance", v: result.features.variance.toFixed(1), ref: "100 – 500" },
            { k: "Min", v: result.features.min.toFixed(1), ref: "-80 – -40" },
            { k: "Max", v: result.features.max.toFixed(1), ref: "40 – 80" },
          ].map((f) => (
            <div key={f.k} className="rounded-xl border border-border bg-surface/40 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.k}</div>
              <div className="mt-1 text-lg font-mono font-semibold">{f.v}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">Ref: {f.ref}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-muted-foreground italic">Reference ranges shown are illustrative demo values.</div>
      </motion.div>

      {/* Explainable AI */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="mt-6 glass-card rounded-2xl p-6 sm:p-8">
        <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Explainability</div>
        <h2 className="mt-1 text-xl font-semibold">Why did the AI make this prediction?</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Feature contribution analysis provides insight into the factors influencing the model's classification.
        </p>

        <div className="mt-6 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.featureImportance} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 40]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} unit="%" />
                <YAxis dataKey="name" type="category" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} width={140} />
                <RTooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, "Importance"]}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {result.featureImportance.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "var(--accent-cyan)" : "var(--accent-blue)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="rounded-xl border border-accent-cyan/30 bg-accent-cyan/5 p-4">
              <div className="text-[10px] uppercase tracking-widest text-accent-cyan">Top Contributing Feature</div>
              <div className="mt-2 text-2xl font-semibold">{result.featureImportance[0].name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {result.featureImportance[0].value}% contribution weight
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {result.featureImportance[0].name} had the strongest influence on this classification based on the model's feature contribution analysis.
              </p>
              <div className="mt-4 text-[10px] text-muted-foreground italic">
                Feature importance reflects model behavior — it does not imply medical causation.
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Health Insights */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 grid gap-4 md:grid-cols-3">
        <InsightCard icon={Waves} title="Pattern Insight" body={result.insights.pattern} accent="var(--accent-cyan)" />
        <InsightCard icon={AlertCircle} title="Risk Insight" body={result.insights.risk} accent={conditionMeta.color} />
        <InsightCard icon={TrendingUp} title="Recommended Next Step" body={result.insights.nextStep} accent="var(--accent-blue)" />
      </motion.div>

      {/* Wellness Indicator */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="mt-6 glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Wellness Indicator</div>
            <h2 className="mt-1 text-xl font-semibold">Sleep Intelligence Score</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              An illustrative demo indicator derived from the classification result.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 max-w-md">
              <MiniStat label="Signal Stability" value={result.signalStability} />
              <MiniStat label="Pattern Consistency" value={result.patternConsistency} />
              <MiniStat label="Risk Index" value={result.riskIndex} invert />
            </div>
          </div>
          <div className="text-center">
            <RadialScore value={result.intelligenceScore} />
            <div className="mt-2 text-sm">
              <span className="font-semibold">{result.intelligenceScore}</span>
              <span className="text-muted-foreground"> / 100</span>
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Status: {statusForScore(result.intelligenceScore)}</div>
            <div className="mt-2 text-[10px] text-muted-foreground italic">Demo Wellness Indicator — illustrative only</div>
          </div>
        </div>
      </motion.div>


      {/* Recommendations */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="mt-6 glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Wellness</div>
            <h2 className="text-xl font-semibold">General Wellness Recommendations</h2>
          </div>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {result.recommendations.map((r, i) => (
            <li key={i} className="rounded-xl border border-border bg-surface/40 p-4 text-sm flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan text-[10px] grid place-items-center font-mono">{i + 1}</div>
              {r}
            </li>
          ))}
        </ul>
        <div className="mt-4 text-xs text-muted-foreground">
          These recommendations provide general educational information and should not replace professional medical advice.
        </div>
      </motion.div>

      {/* Bottom actions */}
      <div className="mt-8 flex flex-wrap gap-3 justify-center print:hidden">
        <Button size="lg" variant="outline" onClick={handleDownload}><Download className="h-4 w-4 mr-2" /> Download Report</Button>
        <Button size="lg" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Print Report</Button>
        <Button size="lg" onClick={handleNew} className="bg-accent-cyan text-primary-foreground hover:bg-accent-cyan/90 shadow-glow"><RotateCw className="h-4 w-4 mr-2" /> Run New Analysis</Button>
      </div>
    </div>
  );
}

function ConfidenceRing({ value, color }: { value: number; color: string }) {
  const size = 180, stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--surface-3)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (value / 100) * c }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 12px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Confidence</div>
          <div className="mt-0.5 text-4xl font-semibold tabular-nums">{value.toFixed(1)}<span className="text-lg text-muted-foreground">%</span></div>
        </div>
      </div>
    </div>
  );
}

function RadialScore({ value }: { value: number }) {
  const size = 160, stroke = 14, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const color = value >= 75 ? "var(--status-normal)" : value >= 50 ? "var(--status-moderate)" : value >= 30 ? "var(--status-high)" : "var(--status-critical)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--surface-3)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (value / 100) * c }}
          transition={{ duration: 1.1 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-3xl font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function statusForScore(v: number) {
  if (v >= 75) return "OPTIMAL";
  if (v >= 50) return "MODERATE";
  if (v >= 30) return "REDUCED";
  return "CRITICAL";
}

function MiniStat({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const good = invert ? value < 30 : value > 70;
  const color = good ? "var(--status-normal)" : (invert ? value > 60 : value < 40) ? "var(--status-critical)" : "var(--status-moderate)";
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-2.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground leading-tight">{label}</div>
      <div className="mt-1.5 flex items-end justify-between">
        <div className="text-lg font-semibold tabular-nums" style={{ color }}>{value}%</div>
      </div>
      <div className="mt-1 h-1 rounded-full bg-surface-3 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} className="h-full" style={{ background: color }} />
      </div>
    </div>
  );
}

function SignalChart({ data, zoom, color, smoothed }: { data: number[]; zoom: number; color: string; smoothed?: boolean }) {
  const sliced = data.slice(0, Math.max(50, Math.floor(data.length / zoom)));
  const chartData = sliced.map((v, i) => ({ t: i, v }));
  return (
    <div className="h-64 rounded-xl border border-border bg-surface/30 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="t" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} label={{ value: "Time (samples)", position: "insideBottom", offset: -4, fill: "var(--muted-foreground)", fontSize: 10 }} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} label={{ value: "Amplitude (µV)", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 10 }} />
          <RTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          <Line type={smoothed ? "monotone" : "linear"} dataKey="v" stroke={color} dot={false} strokeWidth={1.5} isAnimationActive />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function FeatureBands({ features }: { features: import("@/lib/demo-data").Features }) {
  const rows = [
    { k: "Mean", v: features.mean, min: -0.5, max: 0.5 },
    { k: "Std Dev", v: features.std, min: 5, max: 40 },
    { k: "Variance", v: features.variance, min: 50, max: 1800 },
    { k: "Min Amplitude", v: features.min, min: -150, max: -20 },
    { k: "Max Amplitude", v: features.max, min: 20, max: 160 },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface/30 p-5">
      <div className="space-y-4">
        {rows.map((r) => {
          const pct = Math.max(0, Math.min(100, ((r.v - r.min) / (r.max - r.min)) * 100));
          return (
            <div key={r.k}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{r.k}</span>
                <span className="font-mono">{r.v.toFixed(2)}</span>
              </div>
              <div className="relative mt-1.5 h-2 rounded-full bg-surface-3">
                <div className="absolute inset-y-0 left-1/4 right-1/4 rounded-full bg-status-normal/25" />
                <motion.div
                  initial={{ left: 0 }} animate={{ left: `${pct}%` }} transition={{ duration: 0.8 }}
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-background bg-accent-cyan shadow-glow"
                />
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-muted-foreground font-mono">
                <span>{r.min}</span><span>Reference band</span><span>{r.max}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, body, accent }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; accent: string }) {
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-16 opacity-25" style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }} />
      <div className="relative">
        <div className="grid h-9 w-9 place-items-center rounded-lg border" style={{ background: `${accent}18`, borderColor: `${accent}40`, color: accent }}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="mt-3 text-sm font-semibold">{title}</div>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
