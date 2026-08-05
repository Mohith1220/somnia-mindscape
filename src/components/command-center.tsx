import { useMemo, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Brain, Waves, Radar, Sparkles, ShieldAlert, ActivitySquare } from "lucide-react";
import {
  CONDITION_META,
  RISK_COLOR,
  type AnalysisResult,
  type ConditionKey,
} from "@/lib/analysis-types";
import { generateWaveform } from "@/lib/waveform";
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
    () => (result.signalSamples?.length ? result.signalSamples : generateWaveform(result.waveformSeed, 220)),
    [result.signalSamples, result.waveformSeed],
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
          <SignalIntelligencePanel metrics={featureMetrics} accent={accent} reduce={!!reduce} seed={result.waveformSeed} samples={result.signalSamples} />
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
                  <NeuralVisualization accent={accent} reduce={!!reduce} seed={result.waveformSeed} samples={result.signalSamples} />
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
                      EEG Signal — {result.signalProfile.sampleCount} samples processed
                    </div>
                    <EEGWave seed={result.waveformSeed} samples={result.signalSamples} height={220} color={accent} strokeWidth={1.8} fill animate={!reduce} />
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
              <span className="absolute left-3 top-10">μ:{result.features.mean.toFixed(2)}</span>
              <span className="absolute right-3 top-10">P:{result.signalProfile.peakCount}</span>
              <span className="absolute left-3 bottom-3">Z:{result.features.variance.toFixed(1)}</span>
              <span className="absolute right-3 bottom-3">σ:{result.features.std.toFixed(2)}</span>
            </div>

            {/* Callouts — desktop only */}
            <div className="pointer-events-none absolute inset-0 hidden lg:block">
              <Callout style={{ top: "10%", left: "3%" }} title="PATTERN CLASSIFICATION" value={meta.label} sub={`${result.confidence.toFixed(1)}% Confidence`} color={accent} />
              <Callout style={{ bottom: "18%", left: "3%" }} title="TOP FEATURE" value={result.featureImportance[0].name} sub={`${result.featureImportance[0].value}% influence`} color="var(--accent-blue)" />
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

function SignalIntelligencePanel({
  metrics,
  accent,
  reduce,
  seed,
  samples,
}: {
  metrics: { k: string; v: string }[];
  accent: string;
  reduce: boolean;
  seed: number;
  samples?: number[];
}) {
  return (
    <PanelShell title="Signal Intelligence">
      <div className="grid gap-2.5">
        {metrics.map((m, i) => (
          <div key={m.k} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.k}</div>
              <div className="font-mono text-sm">{m.v}</div>
            </div>
            <Sparkline seed={seed + i * 37} color={accent} animate={!reduce} samples={samples} segmentIndex={i} segmentCount={metrics.length} />
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

function NeuralVisualization({ accent, reduce, seed, samples }: { accent: string; reduce: boolean; seed: number; samples?: number[] }) {
  // Deterministic neural nodes
  const nodes = useMemo(() => {
    const arr: { x: number; y: number; r: number }[] = [];
    let s = Math.abs(Math.trunc(seed)) % 233280 || 42;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = 0; i < 26; i++) {
      const angle = rnd() * Math.PI * 2;
      const radius = 60 + rnd() * 110;
      arr.push({
        x: 200 + Math.cos(angle) * radius,
        y: 200 + Math.sin(angle) * radius,
        r: 1.2 + rnd() * 2.2,
      });
    }
    return arr;
  }, [seed]);
  const edges = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        if (Math.hypot(dx, dy) < 70) out.push([i, j]);
      }
    }
    return out;
  }, [nodes]);

  return (
    <svg viewBox="0 0 400 400" className="h-full w-full">
      <defs>
        <radialGradient id="brain-glow">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="70%" stopColor={accent} stopOpacity="0.05" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="brain-stroke" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.6" />
        </linearGradient>
        <filter id="soft-glow">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* Outer glow disk */}
      <circle cx="200" cy="200" r="180" fill="url(#brain-glow)" />

      {/* Concentric rings */}
      {[80, 120, 160, 190].map((r, i) => (
        <motion.circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          fill="none"
          stroke={accent}
          strokeOpacity={0.12 + i * 0.05}
          strokeWidth={0.8}
          strokeDasharray={i % 2 ? "2 4" : undefined}
          initial={{ opacity: 0.3 }}
          animate={reduce ? undefined : { opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        />
      ))}

      {/* Rotating scanning sweep */}
      {!reduce && (
        <motion.g
          style={{ transformOrigin: "200px 200px" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          <path
            d="M 200 200 L 200 20 A 180 180 0 0 1 340 130 Z"
            fill={accent}
            fillOpacity={0.06}
          />
          <line x1="200" y1="200" x2="200" y2="20" stroke={accent} strokeOpacity="0.5" strokeWidth="1" />
        </motion.g>
      )}

      {/* Stylized brain shape (abstract two-hemisphere silhouette) */}
      <g stroke="url(#brain-stroke)" fill="none" strokeWidth="1.5" strokeLinecap="round">
        <path d="M200 90 C 140 90 100 140 100 200 C 100 260 140 310 200 310 C 260 310 300 260 300 200 C 300 140 260 90 200 90 Z" opacity="0.55" />
        <path d="M200 90 C 180 130 180 270 200 310" opacity="0.4" />
        <path d="M130 140 C 170 160 170 240 130 260" opacity="0.4" />
        <path d="M270 140 C 230 160 230 240 270 260" opacity="0.4" />
        <path d="M150 200 C 175 190 225 210 250 200" opacity="0.35" />
      </g>

      {/* Neural nodes + connections */}
      <g>
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke={accent}
            strokeOpacity="0.22"
            strokeWidth="0.6"
          />
        ))}
        {nodes.map((n, i) => (
          <motion.circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={accent}
            initial={{ opacity: 0.6 }}
            animate={reduce ? undefined : { opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.6 + (i % 4) * 0.4, repeat: Infinity, ease: "easeInOut", delay: (i % 5) * 0.2 }}
          />
        ))}
      </g>

      {/* Central pulse */}
      {!reduce && (
        <motion.circle
          cx="200"
          cy="200"
          r={10}
          fill={accent}
          filter="url(#soft-glow)"
          initial={{ r: 10, opacity: 0.7 }}
          animate={{ r: [10, 22, 10], opacity: [0.7, 0.15, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <circle cx="200" cy="200" r="5" fill={accent} />

      {/* EEG overlay along the equator */}
      <g transform="translate(40 340)" opacity="0.45">
        <EEGPath color={accent} seed={seed} samples={samples} />
      </g>

      {/* AI VISUALIZATION label */}
      <text x="200" y="392" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" fill="currentColor" opacity="0.5" className="text-muted-foreground">
        AI Visualization — Conceptual Signal Representation
      </text>
    </svg>
  );
}

function EEGPath({ color, seed, samples }: { color: string; seed: number; samples?: number[] }) {
  const pts = useMemo(() => (samples?.length ? resample(samples, 80) : generateWaveform(seed, 80)), [samples, seed]);
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

function resample(values: number[], points: number) {
  if (values.length === points) return values;
  if (values.length < 2) return values;
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const pos = (i / (points - 1)) * (values.length - 1);
    const left = Math.floor(pos);
    const right = Math.min(values.length - 1, left + 1);
    const mix = pos - left;
    out.push(values[left] * (1 - mix) + values[right] * mix);
  }
  return out;
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

function Sparkline({
  seed,
  color,
  animate,
  samples,
  segmentIndex,
  segmentCount,
}: {
  seed: number;
  color: string;
  animate: boolean;
  samples?: number[];
  segmentIndex: number;
  segmentCount: number;
}) {
  const pts = useMemo(() => {
    if (samples?.length && samples.length >= 2) {
      const safeCount = Math.max(1, segmentCount);
      const segmentSize = Math.max(2, Math.floor(samples.length / safeCount));
      const start = Math.min(samples.length - 2, segmentIndex * segmentSize);
      const end = Math.min(samples.length, start + segmentSize + 1);
      return resample(samples.slice(start, end), 30);
    }
    return generateWaveform(seed + 10, 30);
  }, [samples, seed, segmentIndex, segmentCount]);
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
