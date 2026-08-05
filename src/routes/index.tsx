import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Sparkles, Waves, Gauge, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EEGWave } from "@/components/eeg-wave";
import { CONDITION_META } from "@/lib/analysis-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOMNIA AI — Decode Your Sleep. Understand Your Health." },
      { name: "description", content: "AI-powered analysis of sleep and neurological patterns for intelligent early-stage health screening." },
    ],
  }),
  component: LandingPage,
});

const capabilities = [
  { icon: Brain, title: "AI-Powered Analysis", desc: "Random Forest classification of EEG-derived statistical features." },
  { icon: Waves, title: "Multi-Condition Screening", desc: "Detects Normal, Insomnia, Sleep Apnea and Seizure patterns." },
  { icon: Sparkles, title: "Explainable Predictions", desc: "Feature importance reveals what drives each classification." },
  { icon: Zap, title: "Rapid Results", desc: "From signal to structured health intelligence in seconds." },
];

function LandingPage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Background EEG */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute inset-x-0 top-1/4">
            <EEGWave seed={3} height={200} color="var(--accent-cyan)" strokeWidth={1} />
          </div>
          <div className="absolute inset-x-0 top-1/2">
            <EEGWave seed={2} height={140} color="var(--accent-blue)" strokeWidth={1} />
          </div>
          <div className="absolute inset-x-0 top-2/3">
            <EEGWave seed={1} height={100} color="var(--accent-cyan-soft)" strokeWidth={1} />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-status-normal/30 bg-status-normal/10 px-3 py-1 text-[11px] uppercase tracking-widest text-status-normal">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-status-normal opacity-70 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-normal" />
              </span>
              AI Analysis System Online
            </div>

            <h1 className="mt-6 text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.02] text-gradient">
              Decode Your Sleep.<br />Understand Your Health.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
              AI-powered analysis of sleep and neurological patterns for intelligent early-stage health screening.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/analysis">
                <Button size="lg" className="bg-accent-cyan text-primary-foreground hover:bg-accent-cyan/90 shadow-glow group">
                  Start AI Analysis
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link to="/technology">
                <Button size="lg" variant="outline" className="border-border bg-surface/60 hover:bg-surface-2">
                  Explore Technology
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-accent-cyan" /> AI-assisted screening</div>
              <div className="flex items-center gap-2"><Gauge className="h-3.5 w-3.5 text-accent-cyan" /> 92.4% reported accuracy</div>
              <div className="flex items-center gap-2"><Brain className="h-3.5 w-3.5 text-accent-cyan" /> Random Forest primary model</div>
            </div>
          </motion.div>

          {/* Floating metric chip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden md:block absolute right-8 top-32 w-72"
          >
            <div className="glass-card rounded-2xl p-4 shadow-elevated">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Live Signal Preview</div>
                <div className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-pulse" />
              </div>
              <div className="mt-3 -mx-2">
                <EEGWave seed={4} height={70} color="var(--accent-cyan)" fill />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                <div><div className="text-muted-foreground">σ</div><div className="font-mono">24.6</div></div>
                <div><div className="text-muted-foreground">Var</div><div className="font-mono">605.7</div></div>
                <div><div className="text-muted-foreground">Max</div><div className="font-mono">82.9</div></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl">
          <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Capabilities</div>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">
            Intelligence built for neural signals.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group glass-card rounded-2xl p-5 hover:border-accent-cyan/40 transition-all hover:-translate-y-0.5"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan group-hover:bg-accent-cyan/20 transition-colors">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-semibold">{c.title}</div>
              <div className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{c.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CONDITIONS */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Conditions Screened</div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Four neural patterns.<br className="hidden sm:block" /> One intelligent screen.</h2>
          </div>
          <Link to="/technology" className="text-sm text-accent-cyan hover:text-accent-cyan/80 inline-flex items-center gap-1">
            Learn about our approach <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(Object.entries(CONDITION_META) as [keyof typeof CONDITION_META, typeof CONDITION_META.normal][]).map(([key, c], i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="relative overflow-hidden glass-card rounded-2xl p-5"
            >
              <div className="absolute inset-x-0 top-0 h-16 opacity-30" style={{ background: `linear-gradient(180deg, ${c.color}22, transparent)` }} />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Pattern</div>
                </div>
                <div className="mt-2 font-semibold text-lg">{c.label}</div>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                <div className="mt-4">
                  <EEGWave seed={i + 1} height={40} color={c.color} strokeWidth={1.2} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden glass-card rounded-3xl p-8 md:p-14 text-center">
          <div className="absolute inset-0 opacity-30">
            <EEGWave seed={2} height={200} color="var(--accent-cyan)" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-background/40" />
          <div className="relative">
            <h3 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient">Ready to see your neural pattern?</h3>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Run the AI Analysis Studio with your own EEG dataset or extracted feature values.
            </p>
            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              <Link to="/analysis"><Button size="lg" className="bg-accent-cyan text-primary-foreground hover:bg-accent-cyan/90 shadow-glow">Start AI Analysis <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Link to="/analytics"><Button size="lg" variant="outline">See Model Metrics</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
