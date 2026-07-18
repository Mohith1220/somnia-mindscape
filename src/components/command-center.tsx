import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Brain, Waves, Radar, Sparkles, ShieldAlert, ActivitySquare } from "lucide-react";

const Brain3D = lazy(() => import("@/components/brain-3d"));

import {
  CONDITION_META,
  RISK_COLOR,
  generateWaveform,
  type AnalysisResult,
  type ConditionKey,
} from "@/lib/demo-data";
import { EEGWave } from "@/components/eeg-wave";

type ViewMode = "neural" | "eeg" | "feature" | "ai";

const HERO_LABEL: Record<ConditionKey, string> = {
  normal: "STABLE SIGNAL PATTERN",
  insomnia: "SLEEP PATTERN VARIATION DETECTED",
  apnea: "SLEEP APNEA PATTERN DETECTED",
  seizure: "ABNORMAL NEURAL PATTERN DETECTED",
};

interface Props {
  result: AnalysisResult;
}

export function CommandCenter({ result }: Props) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<ViewMode>("neural");
  const [highlighted, setHighlighted] = useState<ConditionKey | null>(null);

  const meta = CONDITION_META[result.condition];
  const accent = meta.color; // condition-specific accent
  const riskColor = RISK_COLOR[result.risk];

  const probs = useMemo(
    () =>
      (["apnea", "insomnia", "normal", "seizure"] as ConditionKey[])
        .map((k) => ({
          key: k,
          label: CONDITION_META[k].label,
          value: result.probabilities[k],
          color: CONDITION_META[k].color,
        }))
        .sort((a, b) => b.value - a.value),
    [result],
  );

  const waveform = useMemo(
    () => generateWaveform(result.waveformSeed, 220),
    [result.waveformSeed],
  );

  const featureMetrics = [
    { k: "Mean", v: result.features.mean.toFixed(2) },
    { k: "Std Dev", v: result.features.std.toFixed(2) },
    { k: "Variance", v: result.features.variance.toFixed(2) },
    { k: "Minimum", v: result.features.min.toFixed(2) },
    { k: "Maximum", v: result.features.max.toFixed(2) },
  ];

  return (
    <div
      className="relative mt-6 overflow-hidden rounded-3xl border border-border/70 print:hidden"
      style={{
        background:
          "radial-gradient(1200px 500px at 50% -10%, color-mix(in oklab, var(--accent-cyan) 12%, transparent), transparent 60%), linear-gradient(180deg, var(--surface-2), var(--surface))",
      }}
    >
      {/* Grid + scanline ambience */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute inset-0 scanline opacity-30" />
      {/* Condition-tinted glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${accent}22, transparent 70%)` }}
        initial={{ opacity: 0.4 }}
        animate={reduce ? undefined : { opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Corner brackets */}
      <CornerBrackets />

      {/* Top status strip */}
      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border/60 bg-background/40 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <span className="inline-flex items-center gap-2 text-accent-cyan">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-cyan/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-cyan" />
          </span>
          Neural Intelligence Command Center
        </span>
        <span>Model <span className="text-foreground">Random Forest</span></span>
        <span>AI Engine <span className="text-status-normal">Active</span></span>
        <span>Signal <span className="text-foreground">Processed</span></span>
        <span>Features <span className="text-foreground">5 Extracted</span></span>
        <span>Classification <span className="text-status-normal">Complete</span></span>
      </div>

      <div className="relative grid gap-4 p-4 sm:p-6 lg:grid-cols-12 lg:gap-5">
        {/* LEFT COLUMN — panels */}
        <div className="order-3 flex flex-col gap-4 lg:order-1 lg:col-span-3">
          <AnalysisProfilePanel result={result} />
          <SignalIntelligencePanel metrics={featureMetrics} accent={accent} reduce={!!reduce} />
        </div>

        {/* CENTER — visualization */}
        <div className="order-1 lg:order-2 lg:col-span-6">
          <div
            className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/70"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--accent-cyan) 6%, transparent), transparent 70%), linear-gradient(180deg, var(--surface), var(--surface-2))",
            }}
          >
            <AnimatePresence mode="wait">
              {view === "neural" && (
                <motion.div
                  key="neural"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <NeuralVisualization accent={accent} reduce={!!reduce} condition={result.condition} />
                </motion.div>
              )}
              {view === "eeg" && (
                <motion.div
                  key="eeg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 grid place-items-center px-8"
                >
                  <div className="w-full">
                    <div className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      EEG Signal — Seed {result.waveformSeed}
                    </div>
                    <EEGWave seed={result.waveformSeed} height={220} color={accent} strokeWidth={1.8} fill animate={!reduce} />
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] font-mono text-muted-foreground">
                      {["δ 0.5-4Hz", "θ 4-8Hz", "α 8-13Hz", "β 13-30Hz"].map((b) => (
                        <div key={b} className="rounded-md border border-border/60 bg-surface/60 px-1.5 py-1">{b}</div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              {view === "feature" && (
                <motion.div
                  key="feature"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <FeatureMap features={featureMetrics} accent={accent} waveform={waveform} reduce={!!reduce} />
                </motion.div>
              )}
              {view === "ai" && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 grid place-items-center p-6"
                >
                  <AIAnalysisView probs={probs} contributions={result.featureImportance} accent={accent} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* SCAN LABEL */}
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/40 bg-background/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-accent-cyan backdrop-blur">
                <span className="h-1 w-1 rounded-full bg-accent-cyan animate-pulse" />
                Neural Scan Active
              </div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>
                {HERO_LABEL[result.condition]}
              </div>
            </div>

            {/* Coordinate markers */}
            <div className="pointer-events-none absolute inset-0 font-mono text-[9px] text-muted-foreground/70">
              <span className="absolute left-3 top-10">X:0.42</span>
              <span className="absolute right-3 top-10">Y:-0.18</span>
              <span className="absolute left-3 bottom-3">Z:{result.features.variance.toFixed(1)}</span>
              <span className="absolute right-3 bottom-3">σ:{result.features.std.toFixed(2)}</span>
            </div>

            {/* Callouts — desktop only */}
            <div className="pointer-events-none absolute inset-0 hidden lg:block">
              <Callout style={{ top: "10%", left: "3%" }} title="PATTERN CLASSIFICATION" value={meta.label} sub={`${result.confidence.toFixed(1)}% Confidence`} color={accent} />
              <Callout style={{ bottom: "18%", left: "3%" }} title="SIGNAL VARIANCE" value="Elevated Model Influence" sub={`${result.featureImportance[0].value}%`} color="var(--accent-blue)" />
              <Callout style={{ top: "10%", right: "3%" }} title="RISK ASSESSMENT" value={result.risk} color={riskColor} />
            </div>
          </div>

          {/* View controls */}
          <div className="mt-3 flex flex-wrap justify-center gap-1 rounded-xl border border-border/70 bg-background/60 p-1 backdrop-blur">
            {([
              { k: "neural", label: "Neural View", icon: Brain },
              { k: "eeg", label: "EEG Signal", icon: Waves },
              { k: "feature", label: "Feature Map", icon: Radar },
              { k: "ai", label: "AI Analysis", icon: Sparkles },
            ] as const).map((v) => {
              const active = view === v.k;
              const Icon = v.icon;
              return (
                <button
                  key={v.k}
                  onClick={() => setView(v.k)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? "bg-accent-cyan/15 text-accent-cyan"
                      : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="order-2 flex flex-col gap-4 lg:order-3 lg:col-span-3">
          <AIClassificationPanel result={result} accent={accent} riskColor={riskColor} />
          <ClassProbabilityPanel
            probs={probs}
            winner={result.condition}
            highlighted={highlighted}
            onHighlight={setHighlighted}
          />
          <ExplainabilityPanel importance={result.featureImportance} />
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- PANELS --------------------------------- */

function PanelShell({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card rounded-2xl p-4 ${className ?? ""}`}>
      <div className="text-[10px] font-mono uppercase tracking-widest text-accent-cyan">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function AnalysisProfilePanel({ result }: { result: AnalysisResult }) {
  const rows: [string, React.ReactNode][] = [
    ["Analysis ID", <span className="font-mono">{result.id}</span>],
    ["Signal Type", "EEG-Derived Features"],
    ["Primary Model", "Random Forest"],
    ["Features Analyzed", "5"],
  ];
  return (
    <PanelShell title="Analysis Profile">
      <dl className="grid gap-2 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-foreground text-right">{v}</dd>
          </div>
        ))}
        <div className="mt-1 flex items-center justify-between gap-3 border-t border-border/60 pt-2">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-status-normal">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-normal/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-normal" />
            </span>
            Analysis Complete
          </dd>
        </div>
      </dl>
    </PanelShell>
  );
}

function SignalIntelligencePanel({ metrics, accent, reduce }: { metrics: { k: string; v: string }[]; accent: string; reduce: boolean }) {
  return (
    <PanelShell title="Signal Intelligence">
      <div className="grid gap-2.5">
        {metrics.map((m, i) => (
          <div key={m.k} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.k}</div>
              <div className="font-mono text-sm">{m.v}</div>
            </div>
            <Sparkline seed={i + 1} color={accent} animate={!reduce} />
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function AIClassificationPanel({ result, accent, riskColor }: { result: AnalysisResult; accent: string; riskColor: string }) {
  return (
    <PanelShell title="AI Classification">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
        <div className="text-xl font-semibold leading-tight tracking-tight">{result.conditionLabel.toUpperCase()}</div>
      </div>
      <div className="mt-3">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Prediction Confidence</span>
          <span className="font-mono text-lg text-foreground" style={{ color: accent }}>
            {result.confidence.toFixed(1)}%
          </span>
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-surface-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${result.confidence}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: accent, boxShadow: `0 0 12px ${accent}66` }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Risk Assessment</div>
        <div
          className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
          style={{ background: `${riskColor}18`, borderColor: `${riskColor}55`, color: riskColor }}
        >
          <ShieldAlert className="h-3 w-3" /> {result.risk.toUpperCase()}
        </div>
      </div>
      <div className="mt-3 rounded-md border border-border/60 bg-background/40 p-2 text-[10px] text-muted-foreground">
        <span className="font-mono uppercase tracking-widest text-accent-cyan">AI-Assisted Screening Result</span>
        <div className="mt-0.5">Classification output — not a confirmed medical diagnosis.</div>
      </div>
    </PanelShell>
  );
}

function ClassProbabilityPanel({
  probs,
  winner,
  highlighted,
  onHighlight,
}: {
  probs: { key: ConditionKey; label: string; value: number; color: string }[];
  winner: ConditionKey;
  highlighted: ConditionKey | null;
  onHighlight: (k: ConditionKey | null) => void;
}) {
  return (
    <PanelShell title="Class Probability">
      <div className="space-y-2.5">
        {probs.map((p) => {
          const isWinner = p.key === winner;
          const isHighlighted = highlighted === p.key;
          const dim = highlighted && !isHighlighted;
          return (
            <button
              type="button"
              key={p.key}
              onClick={() => onHighlight(isHighlighted ? null : p.key)}
              className={`block w-full text-left transition-opacity ${dim ? "opacity-40" : "opacity-100"}`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                  <span className={isWinner ? "font-semibold" : "text-muted-foreground"}>{p.label}</span>
                  {isWinner && <span className="text-[9px] uppercase tracking-widest text-accent-cyan">Predicted</span>}
                </span>
                <span className="font-mono tabular-nums" style={{ color: isWinner ? p.color : undefined }}>
                  {p.value.toFixed(1)}%
                </span>
              </div>
              <div className={`mt-1 h-1.5 rounded-full bg-surface-3 overflow-hidden ring-1 ${isHighlighted ? "ring-accent-cyan/60" : "ring-transparent"}`}>
                <motion.div
                  key={`${p.key}-${p.value}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${p.value}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: p.color, boxShadow: isWinner ? `0 0 10px ${p.color}66` : undefined }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </PanelShell>
  );
}

function ExplainabilityPanel({ importance }: { importance: { name: string; value: number }[] }) {
  const top = importance[0];
  return (
    <PanelShell title="AI Explainability">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-md border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan">
          <ActivitySquare className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Top Contributing Feature</div>
          <div className="text-sm font-semibold">{top.name}</div>
        </div>
        <div className="ml-auto font-mono text-lg" style={{ color: "var(--accent-cyan)" }}>
          {top.value}%
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {importance.map((f, i) => (
          <div key={f.name}>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{f.name}</span>
              <span className="font-mono">{f.value}%</span>
            </div>
            <div className="mt-0.5 h-1 rounded-full bg-surface-3 overflow-hidden">
              <motion.div
                key={f.value}
                initial={{ width: 0 }}
                animate={{ width: `${(f.value / 40) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.05 }}
                className="h-full rounded-full"
                style={{ background: i === 0 ? "var(--accent-cyan)" : "var(--accent-blue)" }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[10px] italic text-muted-foreground">
        Feature influence does not imply medical causation.
      </div>
    </PanelShell>
  );
}

/* --------------------------- CENTRAL VISUALS --------------------------- */

// Anatomically-recognizable side-view digital brain built from SVG.
// - Layer 1: transparent cyan cerebral silhouette with gyri/cerebellum/brain stem
// - Layer 2: dense deterministic neural mesh confined to the silhouette
// - Layer 3: slow signal pulses traveling along a few edges
// - Layer 4: scenario-tinted "activity clusters" (conceptual, non-anatomical)
// - Background: concentric scan rings + rotating scanner arc + scan band sweep
// - Motion: subtle idle float + mouse parallax (desktop), respects reduced motion
function NeuralVisualization({
  accent,
  reduce,
  condition,
}: {
  accent: string;
  reduce: boolean;
  condition: ConditionKey;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Side-profile cerebral silhouette (approximate, anatomically readable).
  const BRAIN_OUTLINE =
    "M 118 214 " +
    "C 108 168 132 118 178 100 " +
    "C 214 86 258 88 292 108 " +
    "C 322 124 340 152 342 184 " +
    "C 344 208 336 222 322 232 " +
    "C 332 246 332 264 320 278 " +
    "C 328 296 316 314 296 322 " +
    "C 280 336 254 344 226 344 " +
    "C 192 344 158 336 138 320 " +
    "C 118 306 108 284 116 262 " +
    "C 100 250 96 232 118 214 Z";

  // Gyri (cortical folds) — thin arced lines that suggest the cerebral surface.
  const GYRI = [
    "M 132 168 C 168 150 208 148 244 158",
    "M 128 194 C 170 176 224 176 274 190",
    "M 128 222 C 176 210 236 212 288 226",
    "M 138 250 C 184 240 244 244 296 258",
    "M 152 278 C 194 272 246 276 296 288",
    "M 172 304 C 210 302 254 304 292 312",
    "M 200 108 C 208 140 210 190 208 244",
    "M 244 108 C 252 150 254 210 250 268",
    "M 168 116 C 172 154 172 210 172 260",
  ];

  // Central sulcus emphasis
  const CENTRAL_SULCUS = "M 216 96 C 224 150 226 220 220 300";

  // Cerebellum (small lobed structure lower-back) + brain stem
  const CEREBELLUM =
    "M 300 316 C 322 314 342 326 344 348 " +
    "C 344 366 326 378 304 376 " +
    "C 288 374 278 358 282 342 " +
    "C 284 330 292 320 300 316 Z";
  const BRAIN_STEM =
    "M 268 340 C 272 360 274 380 268 396 " +
    "L 258 396 C 254 378 254 358 258 340 Z";

  // Deterministic neural nodes clipped to the brain silhouette
  const nodes = useMemo(() => {
    const arr: { x: number; y: number; r: number; k: number }[] = [];
    let s = 1337;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
    // Silhouette bounding box roughly x∈[95,345], y∈[90,400]
    while (arr.length < 130) {
      const x = 100 + rnd() * 245;
      const y = 95 + rnd() * 300;
      // Rough elliptical clip approximating cerebrum + cerebellum region
      const cerebrum =
        Math.pow((x - 224) / 118, 2) + Math.pow((y - 220) / 128, 2) < 1;
      const cerebellum =
        Math.pow((x - 312) / 30, 2) + Math.pow((y - 348) / 26, 2) < 1;
      if (!cerebrum && !cerebellum) continue;
      arr.push({ x, y, r: 0.9 + rnd() * 1.9, k: Math.floor(rnd() * 100) });
    }
    return arr;
  }, []);

  const edges = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.hypot(dx, dy);
        if (d < 38) out.push([i, j]);
      }
    }
    return out;
  }, [nodes]);

  // Scenario-specific activity cluster centers (conceptual only)
  const CLUSTERS: Record<ConditionKey, { x: number; y: number; r: number }[]> = {
    normal: [
      { x: 200, y: 200, r: 40 },
      { x: 260, y: 220, r: 34 },
    ],
    insomnia: [
      { x: 175, y: 165, r: 32 },
      { x: 250, y: 180, r: 30 },
      { x: 210, y: 250, r: 28 },
    ],
    apnea: [
      { x: 195, y: 210, r: 36 },
      { x: 265, y: 240, r: 32 },
      { x: 305, y: 350, r: 22 },
    ],
    seizure: [
      { x: 175, y: 175, r: 38 },
      { x: 240, y: 200, r: 36 },
      { x: 275, y: 260, r: 30 },
    ],
  };

  // Pick a few edges to animate as traveling signals
  const signalEdges = useMemo(
    () => edges.filter((_, i) => i % 11 === 0).slice(0, 8),
    [edges],
  );

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 6, y: px * 8 });
  };
  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      className="absolute inset-0"
      onMouseMove={handleMouse}
      onMouseLeave={resetTilt}
      style={{ perspective: 1200 }}
    >
      {/* Background scan grid ring */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="bg-halo">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="60%" stopColor={accent} stopOpacity="0.04" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="210" r="185" fill="url(#bg-halo)" />
        {[110, 145, 175, 195].map((r, i) => (
          <motion.circle
            key={r}
            cx="200"
            cy="210"
            r={r}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeOpacity={0.08 + i * 0.03}
            strokeWidth={0.6}
            strokeDasharray={i % 2 ? "2 5" : undefined}
            initial={{ opacity: 0.3 }}
            animate={reduce ? undefined : { opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          />
        ))}
        {/* Rotating scanner arc — independent from brain */}
        {!reduce && (
          <motion.g
            style={{ transformOrigin: "200px 210px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          >
            <path
              d="M 200 210 L 200 15 A 195 195 0 0 1 355 130 Z"
              fill="var(--accent-cyan)"
              fillOpacity={0.04}
            />
            <line x1="200" y1="210" x2="200" y2="15" stroke="var(--accent-cyan)" strokeOpacity="0.35" strokeWidth="0.8" />
          </motion.g>
        )}
        {/* Coordinate ticks */}
        <g stroke="var(--accent-cyan)" strokeOpacity="0.3" strokeWidth="0.5">
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const x1 = 200 + Math.cos(a) * 198;
            const y1 = 210 + Math.sin(a) * 198;
            const x2 = 200 + Math.cos(a) * (i % 3 === 0 ? 188 : 193);
            const y2 = 210 + Math.sin(a) * (i % 3 === 0 ? 188 : 193);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
      </svg>

      {/* Brain layer with tilt + idle float */}
      <motion.div
        className="absolute inset-0"
        animate={
          reduce
            ? undefined
            : { y: [0, -4, 0, 3, 0] }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 400ms ease-out",
        }}
      >
        <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="brain-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.18" />
              <stop offset="60%" stopColor="var(--accent-blue)" stopOpacity="0.08" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.14" />
            </linearGradient>
            <linearGradient id="brain-edge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.95" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.75" />
            </linearGradient>
            <radialGradient id="cluster-glow">
              <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
              <stop offset="60%" stopColor={accent} stopOpacity="0.15" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
            <filter id="node-glow">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
            <filter id="soft-blur">
              <feGaussianBlur stdDeviation="0.6" />
            </filter>
            <clipPath id="brain-clip">
              <path d={BRAIN_OUTLINE} />
              <path d={CEREBELLUM} />
            </clipPath>
            <linearGradient id="scan-band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--accent-cyan)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Brain-stem behind cerebellum */}
          <path d={BRAIN_STEM} fill="url(#brain-body)" stroke="url(#brain-edge)" strokeWidth="1.1" opacity="0.9" />

          {/* Cerebrum body */}
          <path
            d={BRAIN_OUTLINE}
            fill="url(#brain-body)"
            stroke="url(#brain-edge)"
            strokeWidth="1.4"
            filter="url(#soft-blur)"
            opacity="0.95"
          />
          {/* Cerebellum */}
          <path
            d={CEREBELLUM}
            fill="url(#brain-body)"
            stroke="url(#brain-edge)"
            strokeWidth="1.1"
            opacity="0.95"
          />

          {/* Cortical fold hints (gyri) */}
          <g stroke="var(--accent-cyan)" strokeOpacity="0.35" strokeWidth="0.7" fill="none" clipPath="url(#brain-clip)">
            {GYRI.map((d, i) => (
              <path key={i} d={d} />
            ))}
            <path d={CENTRAL_SULCUS} strokeOpacity="0.45" />
            {/* Cerebellum striations */}
            <path d="M 288 328 C 312 322 336 336 342 356" />
            <path d="M 286 344 C 310 340 334 350 344 366" />
          </g>

          {/* Everything below is confined inside the brain silhouette */}
          <g clipPath="url(#brain-clip)">
            {/* Scenario activity clusters (conceptual glows) */}
            {CLUSTERS[condition].map((c, i) => (
              <motion.circle
                key={`cl-${i}`}
                cx={c.x}
                cy={c.y}
                r={c.r}
                fill="url(#cluster-glow)"
                initial={{ opacity: 0.35 }}
                animate={reduce ? undefined : { opacity: [0.25, 0.7, 0.25] }}
                transition={{ duration: 3.2 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
              />
            ))}

            {/* Neural mesh — edges */}
            <g stroke="var(--accent-cyan)" strokeOpacity="0.18" strokeWidth="0.4">
              {edges.map(([a, b], i) => (
                <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
              ))}
            </g>

            {/* Traveling signal pulses along a few edges */}
            {!reduce &&
              signalEdges.map(([a, b], i) => (
                <motion.circle
                  key={`sig-${i}`}
                  r={1.6}
                  fill={accent}
                  filter="url(#node-glow)"
                  initial={{ cx: nodes[a].x, cy: nodes[a].y, opacity: 0 }}
                  animate={{
                    cx: [nodes[a].x, nodes[b].x],
                    cy: [nodes[a].y, nodes[b].y],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2.2 + (i % 3) * 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.4,
                  }}
                />
              ))}

            {/* Neural nodes */}
            {nodes.map((n, i) => {
              // Nodes inside any cluster get accent color; others stay cyan
              const inCluster = CLUSTERS[condition].some(
                (c) => Math.hypot(c.x - n.x, c.y - n.y) < c.r,
              );
              const fill = inCluster ? accent : "var(--accent-cyan)";
              return (
                <motion.circle
                  key={i}
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  fill={fill}
                  initial={{ opacity: inCluster ? 0.7 : 0.45 }}
                  animate={
                    reduce
                      ? undefined
                      : { opacity: inCluster ? [0.55, 1, 0.55] : [0.35, 0.75, 0.35] }
                  }
                  transition={{
                    duration: 2.4 + (n.k % 5) * 0.35,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: (n.k % 7) * 0.15,
                  }}
                />
              );
            })}

            {/* Scanning band — vertical translucent sweep, 6s loop */}
            {!reduce && (
              <motion.rect
                x="80"
                width="280"
                height="34"
                fill="url(#scan-band)"
                initial={{ y: 80 }}
                animate={{ y: [80, 380, 80] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </g>

          {/* Central highlight */}
          <circle cx="222" cy="212" r="3" fill="var(--accent-cyan)" filter="url(#node-glow)" />

          {/* Conceptual disclaimer */}
          <text
            x="200"
            y="392"
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize="8"
            fill="currentColor"
            opacity="0.55"
            className="text-muted-foreground"
          >
            AI Visualization — Conceptual Signal Representation
          </text>
        </svg>
      </motion.div>
    </div>
  );
}

function EEGPath({ color }: { color: string }) {
  const pts = useMemo(() => generateWaveform(3, 80), []);
  const w = 320,
    h = 30;
  const max = Math.max(...pts.map(Math.abs)) || 1;
  const step = w / (pts.length - 1);
  let d = "";
  pts.forEach((v, i) => {
    const x = i * step;
    const y = h / 2 - (v / max) * (h / 2 - 2);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
  });
  return <path d={d} fill="none" stroke={color} strokeWidth={0.9} />;
}

function FeatureMap({
  features,
  accent,
  waveform,
  reduce,
}: {
  features: { k: string; v: string }[];
  accent: string;
  waveform: number[];
  reduce: boolean;
}) {
  const cx = 200,
    cy = 200,
    R = 130;
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full">
      <defs>
        <radialGradient id="fm-glow">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R + 30} fill="url(#fm-glow)" />
      {/* central signal */}
      <g transform={`translate(${cx - 90} ${cy - 20})`}>
        {(() => {
          const w = 180,
            h = 40;
          const max = Math.max(...waveform.map(Math.abs)) || 1;
          const step = w / (waveform.length - 1);
          let d = "";
          waveform.forEach((v, i) => {
            const x = i * step;
            const y = h / 2 - (v / max) * (h / 2 - 2);
            d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
          });
          return <path d={d} stroke={accent} strokeWidth="1.5" fill="none" />;
        })()}
      </g>
      <text x={cx} y={cy + 42} textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill="currentColor" className="text-muted-foreground">
        EEG SIGNAL
      </text>
      {features.map((f, i) => {
        const a = (i / features.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R;
        return (
          <g key={f.k}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={accent} strokeOpacity="0.25" strokeDasharray="2 3" />
            <motion.circle
              cx={x}
              cy={y}
              r={22}
              fill="var(--surface-2)"
              stroke={accent}
              strokeOpacity="0.7"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
            />
            {!reduce && (
              <motion.circle
                cx={x}
                cy={y}
                r={22}
                fill="none"
                stroke={accent}
                strokeOpacity="0.4"
                animate={{ r: [22, 28, 22], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
              />
            )}
            <text x={x} y={y - 2} textAnchor="middle" fontSize="7" fontFamily="ui-monospace, monospace" fill="currentColor" className="text-muted-foreground">
              {f.k.toUpperCase()}
            </text>
            <text x={x} y={y + 8} textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill={accent}>
              {f.v}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function AIAnalysisView({
  probs,
  contributions,
  accent,
}: {
  probs: { key: ConditionKey; label: string; value: number; color: string }[];
  contributions: { name: string; value: number }[];
  accent: string;
}) {
  return (
    <div className="grid w-full max-w-md gap-4">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-accent-cyan">Classification Confidence</div>
        <div className="mt-2 space-y-2">
          {probs.map((p) => (
            <div key={p.key}>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{p.label}</span>
                <span className="font-mono" style={{ color: p.color }}>{p.value.toFixed(1)}%</span>
              </div>
              <div className="mt-0.5 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <motion.div
                  key={p.value}
                  initial={{ width: 0 }}
                  animate={{ width: `${p.value}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ background: p.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-accent-cyan">Feature Contribution</div>
        <div className="mt-2 space-y-1.5">
          {contributions.map((f, i) => (
            <div key={f.name}>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{f.name}</span>
                <span className="font-mono">{f.value}%</span>
              </div>
              <div className="mt-0.5 h-1 rounded-full bg-surface-3 overflow-hidden">
                <motion.div
                  key={f.value}
                  initial={{ width: 0 }}
                  animate={{ width: `${(f.value / 40) * 100}%` }}
                  transition={{ duration: 0.7, delay: i * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: i === 0 ? accent : "var(--accent-blue)" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- CALLOUTS & UTILS --------------------------- */

function Callout({
  title,
  value,
  sub,
  color,
  style,
}: {
  title: string;
  value: string;
  sub?: string;
  color: string;
  style: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="pointer-events-auto absolute max-w-[180px]"
      style={style}
    >
      <div className="rounded-lg border border-border/70 bg-background/70 px-2.5 py-1.5 backdrop-blur">
        <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{title}</div>
        <div className="text-xs font-semibold" style={{ color }}>{value}</div>
        {sub && <div className="text-[10px] font-mono text-muted-foreground">{sub}</div>}
      </div>
    </motion.div>
  );
}

function Sparkline({ seed, color, animate }: { seed: number; color: string; animate: boolean }) {
  const pts = useMemo(() => generateWaveform(seed + 10, 30), [seed]);
  const w = 60,
    h = 20;
  const max = Math.max(...pts.map(Math.abs)) || 1;
  const step = w / (pts.length - 1);
  const d = pts
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h / 2 - (v / max) * (h / 2 - 2)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={animate ? { pathLength: 1, opacity: [0.5, 1, 0.5] } : { pathLength: 1, opacity: 0.8 }}
        transition={{ duration: 3, repeat: animate ? Infinity : 0, ease: "easeInOut" }}
      />
    </svg>
  );
}

function CornerBrackets() {
  const base = "pointer-events-none absolute h-4 w-4 border-accent-cyan/50";
  return (
    <>
      <div className={`${base} left-2 top-2 border-l border-t`} />
      <div className={`${base} right-2 top-2 border-r border-t`} />
      <div className={`${base} left-2 bottom-2 border-l border-b`} />
      <div className={`${base} right-2 bottom-2 border-r border-b`} />
    </>
  );
}
