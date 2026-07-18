import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Database, Filter, Wand2, ScatterChart, Brain, ShieldAlert, Sparkles, ArrowRight,
  TreePine, Split, LineChart as LineIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CONDITION_META, type ConditionKey } from "@/lib/demo-data";
import { EEGWave } from "@/components/eeg-wave";

export const Route = createFileRoute("/technology")({
  head: () => ({
    meta: [
      { title: "Technology — SOMNIA AI" },
      { name: "description", content: "Machine learning pipeline, models, and feature engineering behind SOMNIA AI's neural pattern analysis." },
    ],
  }),
  component: TechPage,
});

const PIPELINE = [
  { icon: Database, title: "Data Collection", desc: "Ingest raw EEG signal data from source recordings." },
  { icon: Filter, title: "Data Preprocessing", desc: "Clean and normalize signal data for consistent analysis." },
  { icon: Wand2, title: "Feature Extraction", desc: "Compute mean, standard deviation, variance, min and max features." },
  { icon: ScatterChart, title: "Feature Scaling", desc: "Standardize features so no single dimension dominates the model." },
  { icon: Brain, title: "ML Classification", desc: "Random Forest, SVM and Logistic Regression predict the pattern class." },
  { icon: ShieldAlert, title: "Risk Assessment", desc: "Translate predictions into interpretable risk categories." },
  { icon: Sparkles, title: "AI Insights", desc: "Generate contextual explanations, recommendations and reports." },
];

const MODELS = [
  { icon: TreePine, name: "Random Forest", primary: true, desc: "Ensemble of decision trees that vote on the final classification, offering strong accuracy and robust feature importance signals." },
  { icon: Split, name: "SVM", desc: "Finds an optimal separating boundary between classes in the feature space — effective on smaller, well-defined datasets." },
  { icon: LineIcon, name: "Logistic Regression", desc: "Fast, interpretable baseline classifier that models probability of each class as a linear combination of features." },
];

const FEATURES = [
  { k: "Mean", d: "Average amplitude — a baseline measure of overall signal level." },
  { k: "Standard Deviation", d: "How much the signal deviates from its mean — an indicator of variability." },
  { k: "Variance", d: "Squared deviation from the mean — captures pattern intensity." },
  { k: "Minimum", d: "Lowest observed amplitude — highlights signal dips or negative spikes." },
  { k: "Maximum", d: "Highest observed amplitude — highlights peaks and bursts." },
];

function TechPage() {
  const [openCondition, setOpenCondition] = useState<ConditionKey | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">How It Works</div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">The intelligence behind SOMNIA AI</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A transparent look at the machine learning pipeline, models, and features that power neural pattern screening.
        </p>
      </motion.div>

      {/* PIPELINE */}
      <section className="mt-12">
        <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Pipeline</div>
        <h2 className="mt-1 text-2xl font-semibold">End-to-end ML flow</h2>
        <div className="mt-8 relative">
          <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-accent-cyan/40 via-accent-blue/30 to-transparent md:hidden" />
          <div className="hidden md:block absolute top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent" />
          <div className="grid gap-4 md:grid-cols-7">
            {PIPELINE.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="relative"
              >
                <div className="glass-card rounded-2xl p-4 h-full">
                  <div className="flex md:flex-col items-center md:items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan">
                      <s.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-muted-foreground">STEP 0{i + 1}</div>
                      <div className="text-sm font-semibold mt-0.5">{s.title}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed hidden md:block">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MODELS */}
      <section className="mt-16">
        <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Models</div>
        <h2 className="mt-1 text-2xl font-semibold">Three classifiers, one primary model</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {MODELS.map((m) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`relative glass-card rounded-2xl p-6 ${m.primary ? "border-accent-cyan/40" : ""}`}
            >
              {m.primary && (
                <div className="absolute -top-2 right-4 rounded-full bg-accent-cyan text-primary-foreground text-[10px] uppercase tracking-widest px-2 py-0.5">Primary</div>
              )}
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan">
                <m.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-lg font-semibold">{m.name}</div>
              {m.primary && <div className="text-[11px] text-accent-cyan mt-1">Primary Classification Model</div>}
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mt-16">
        <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Feature Engineering</div>
        <h2 className="mt-1 text-2xl font-semibold">Five EEG-derived statistical features</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.k} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-5">
              <div className="text-[10px] font-mono text-muted-foreground">FEATURE {String(i + 1).padStart(2, "0")}</div>
              <div className="mt-1 text-lg font-semibold">{f.k}</div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CONDITIONS */}
      <section className="mt-16">
        <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Screened Conditions</div>
        <h2 className="mt-1 text-2xl font-semibold">Conditions screened by SOMNIA AI</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(Object.entries(CONDITION_META) as [ConditionKey, typeof CONDITION_META.normal][]).map(([k, c], i) => (
            <button
              key={k}
              onClick={() => setOpenCondition(k)}
              className="text-left glass-card rounded-2xl p-5 hover:border-accent-cyan/40 transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Pattern</div>
              </div>
              <div className="mt-2 font-semibold text-lg">{c.label}</div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{c.description}</p>
              <div className="mt-4">
                <EEGWave seed={i + 1} height={44} color={c.color} strokeWidth={1.2} />
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <Dialog open={openCondition !== null} onOpenChange={(o) => !o && setOpenCondition(null)}>
        <DialogContent className="bg-surface border-border max-w-lg">
          {openCondition && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: CONDITION_META[openCondition].color }} />
                  <DialogTitle>{CONDITION_META[openCondition].label}</DialogTitle>
                </div>
                <DialogDescription className="pt-1">{CONDITION_META[openCondition].description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Overview</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    SOMNIA AI screens for signal patterns statistically associated with {CONDITION_META[openCondition].label.toLowerCase()} using EEG-derived features and a Random Forest classifier.
                  </p>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Common indicators</div>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li>• Notable amplitude variability across the signal window</li>
                    <li>• Distinctive statistical feature patterns</li>
                    <li>• Elevated variance and standard deviation profiles</li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Why early screening matters</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Early identification of concerning patterns supports timely evaluation by qualified healthcare professionals. Screening is not a substitute for clinical diagnosis.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
