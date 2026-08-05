import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EEGWave } from "./eeg-wave";
import { CheckCircle2, Loader2 } from "lucide-react";

const STAGES = [
  { id: "01", title: "Signal Validation", message: "Validating EEG signal data..." },
  { id: "02", title: "Feature Extraction", message: "Extracting statistical signal characteristics..." },
  { id: "03", title: "Feature Scaling", message: "Standardizing extracted features..." },
  { id: "04", title: "Pattern Recognition", message: "Evaluating neural signal patterns..." },
  { id: "05", title: "AI Classification", message: "Running Random Forest classifier..." },
  { id: "06", title: "Confidence Analysis", message: "Calculating classification confidence..." },
];

interface Props {
  open: boolean;
  onComplete: () => void;
  seed?: number;
}

export function ProcessingOverlay({ open, onComplete, seed = 3 }: Props) {
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setStage(0);
      setDone(false);
      return;
    }
    setStage(0);
    setDone(false);
    const stageDur = 580;
    let s = 0;
    const int = setInterval(() => {
      s += 1;
      if (s >= STAGES.length) {
        clearInterval(int);
        setStage(STAGES.length - 1);
        setDone(true);
        setTimeout(() => onComplete(), 800);
        return;
      }
      setStage(s);
    }, stageDur);
    return () => clearInterval(int);
  }, [open, onComplete]);

  const currentMessage = done
    ? "Generating AI-assisted insights..."
    : STAGES[stage].message;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl grid place-items-center px-4"
          role="dialog"
          aria-label="AI processing in progress"
          aria-live="polite"
        >
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="absolute inset-0 scanline pointer-events-none opacity-40" />

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative w-full max-w-3xl"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1 text-[11px] uppercase tracking-widest text-accent-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-pulse" />
                {done ? "Analysis Complete" : "AI Processing"}
              </div>
              <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
                {done ? "Analysis Complete" : "Analyzing Neural Patterns"}
              </h2>
            </div>

            <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-elevated">
              <EEGWave seed={seed} height={100} />

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {STAGES.map((s, i) => {
                  const active = i === stage && !done;
                  const complete = i < stage || done;
                  return (
                    <div
                      key={s.id}
                      className={`relative rounded-xl border p-2.5 transition-all ${
                        complete
                          ? "border-status-normal/40 bg-status-normal/5"
                          : active
                          ? "border-accent-cyan/50 bg-accent-cyan/5"
                          : "border-border bg-surface/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground">{s.id}</span>
                        {complete ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-status-normal" />
                        ) : active ? (
                          <Loader2 className="h-3.5 w-3.5 text-accent-cyan animate-spin" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                        )}
                      </div>
                      <div className={`mt-1.5 text-[11px] font-medium leading-tight ${active || complete ? "text-foreground" : "text-muted-foreground"}`}>
                        {s.title}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 h-6 text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${stage}-${done}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-sm text-muted-foreground font-mono"
                  >
                    {currentMessage}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-4 h-1 rounded-full bg-surface-3 overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: done ? "100%" : `${((stage + 1) / STAGES.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-accent-cyan to-accent-blue"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
