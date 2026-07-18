import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Upload, FileText, X, CheckCircle2, Sliders, Play, RotateCcw, Info, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProcessingOverlay } from "@/components/processing-overlay";
import { useAnalysisStore } from "@/lib/analysis-store";
import { DEMO_SCENARIOS, type ConditionKey } from "@/lib/demo-data";
import { toast } from "sonner";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "AI Analysis Studio — SOMNIA AI" },
      { name: "description", content: "Upload EEG data or enter extracted signal features to begin intelligent pattern analysis." },
    ],
  }),
  component: AnalysisStudio,
});

const FEATURE_INFO = {
  mean: { label: "EEG Mean", tip: "Average amplitude of the EEG signal over the window." },
  std: { label: "EEG Standard Deviation", tip: "Dispersion of the signal around its mean." },
  variance: { label: "EEG Variance", tip: "Squared deviation of the signal — a strong indicator of pattern intensity." },
  min: { label: "Minimum Amplitude", tip: "Lowest signal value observed in the window." },
  max: { label: "Maximum Amplitude", tip: "Highest signal value observed in the window." },
} as const;

function AnalysisStudio() {
  const navigate = useNavigate();
  const { runAnalysis, selectedDemo, setDemo } = useAnalysisStore();
  const [processing, setProcessing] = useState(false);
  const [fileLoaded, setFileLoaded] = useState<{ name: string; size: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [features, setFeatures] = useState({ mean: "", std: "", variance: "", min: "", max: "" });

  const loadDemoFile = () => {
    setFileLoaded({ name: "demo_sleep_signal.csv", size: "2.4 MB" });
    toast.success("Demo EEG sample loaded");
  };

  const loadDemoValues = () => {
    const s = DEMO_SCENARIOS[selectedDemo];
    setFeatures({
      mean: s.features.mean.toString(),
      std: s.features.std.toString(),
      variance: s.features.variance.toString(),
      min: s.features.min.toString(),
      max: s.features.max.toString(),
    });
    toast.success(`Loaded ${s.conditionLabel} demo values`);
  };

  const resetFeatures = () => setFeatures({ mean: "", std: "", variance: "", min: "", max: "" });

  const startAnalysis = (condition?: ConditionKey) => {
    if (condition) setDemo(condition);
    setProcessing(true);
  };

  const onProcessingComplete = () => {
    runAnalysis();
    setProcessing(false);
    navigate({ to: "/results" });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFileLoaded({ name: f.name, size: `${(f.size / (1024 * 1024)).toFixed(2)} MB` });
  };

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Analysis Studio</div>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">AI Analysis Studio</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Upload EEG data or enter extracted signal features to begin intelligent pattern analysis.
          </p>
        </motion.div>

        {/* Demo scenario selector */}
        <div className="mt-8 glass-card rounded-2xl p-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan">
              <Beaker className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Demo Mode</div>
              <div className="text-xs text-muted-foreground">Preview a deterministic scenario for demonstration.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedDemo} onValueChange={(v) => setDemo(v as ConditionKey)}>
              <SelectTrigger className="w-52 bg-surface"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal Sample</SelectItem>
                <SelectItem value="insomnia">Insomnia Sample</SelectItem>
                <SelectItem value="apnea">Sleep Apnea Sample</SelectItem>
                <SelectItem value="seizure">Seizure Sample</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="upload" className="mt-6">
          <TabsList className="bg-surface/70 border border-border">
            <TabsTrigger value="upload" className="data-[state=active]:bg-accent-cyan/10 data-[state=active]:text-accent-cyan">
              <Upload className="h-3.5 w-3.5 mr-2" /> EEG Data Upload
            </TabsTrigger>
            <TabsTrigger value="manual" className="data-[state=active]:bg-accent-cyan/10 data-[state=active]:text-accent-cyan">
              <Sliders className="h-3.5 w-3.5 mr-2" /> Manual Feature Analysis
            </TabsTrigger>
          </TabsList>

          {/* UPLOAD TAB */}
          <TabsContent value="upload" className="mt-6">
            <div className="glass-card rounded-2xl p-6 sm:p-8">
              {!fileLoaded ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`relative rounded-xl border-2 border-dashed transition-all py-16 px-6 text-center ${
                    dragOver ? "border-accent-cyan bg-accent-cyan/5" : "border-border/70 hover:border-accent-cyan/40 bg-surface/30"
                  }`}
                >
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="mt-4 font-semibold text-lg">Upload EEG Data</div>
                  <p className="mt-1 text-sm text-muted-foreground">Drag and drop your EEG dataset or browse your device.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Supported: CSV, EDF, TXT · Max 50MB</p>
                  <div className="mt-6 flex justify-center gap-3">
                    <Button variant="outline" onClick={() => setFileLoaded({ name: "eeg_session_04.csv", size: "3.1 MB" })}>Browse File</Button>
                    <Button variant="ghost" onClick={loadDemoFile} className="text-accent-cyan hover:text-accent-cyan hover:bg-accent-cyan/10">
                      Use Demo EEG Sample
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="rounded-xl border border-border bg-surface/50 p-5 flex items-center gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium truncate">{fileLoaded.name}</div>
                        <span className="rounded-full bg-status-normal/15 text-status-normal text-[10px] uppercase tracking-widest px-2 py-0.5 border border-status-normal/30">
                          <CheckCircle2 className="h-2.5 w-2.5 inline mr-1" /> Ready
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">EEG Dataset · {fileLoaded.size} · Uploaded just now</div>
                      <div className="mt-2 h-1 rounded-full bg-surface-3 overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-accent-cyan to-accent-blue" />
                      </div>
                    </div>
                    <button aria-label="Remove file" onClick={() => setFileLoaded(null)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-surface-2 text-muted-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button size="lg" className="bg-accent-cyan text-primary-foreground hover:bg-accent-cyan/90 shadow-glow" onClick={() => startAnalysis()}>
                      <Play className="h-4 w-4 mr-2" /> Analyze EEG Data
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* MANUAL TAB */}
          <TabsContent value="manual" className="mt-6">
            <div className="glass-card rounded-2xl p-6 sm:p-8">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(FEATURE_INFO) as (keyof typeof FEATURE_INFO)[]).map((k) => (
                  <div key={k}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Label htmlFor={k} className="text-sm">{FEATURE_INFO[k].label}</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground hover:text-foreground"><Info className="h-3 w-3" /></button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{FEATURE_INFO[k].tip}</TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id={k}
                      type="number"
                      value={features[k]}
                      onChange={(e) => setFeatures((p) => ({ ...p, [k]: e.target.value }))}
                      placeholder="0.00"
                      className="bg-surface font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3 justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={loadDemoValues}><Beaker className="h-4 w-4 mr-2" /> Load Demo Values</Button>
                  <Button variant="ghost" onClick={resetFeatures}><RotateCcw className="h-4 w-4 mr-2" /> Reset</Button>
                </div>
                <Button
                  size="lg"
                  className="bg-accent-cyan text-primary-foreground hover:bg-accent-cyan/90 shadow-glow"
                  onClick={() => startAnalysis()}
                  disabled={Object.values(features).some((v) => v === "")}
                >
                  <Play className="h-4 w-4 mr-2" /> Analyze Features
                </Button>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Tip: Use <span className="text-accent-cyan">Load Demo Values</span> to populate deterministic feature values from the selected demo scenario.
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 rounded-xl border border-border/60 bg-surface/40 p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">Note.</strong> SOMNIA AI is an AI-assisted screening tool. Results should not be interpreted as a confirmed medical diagnosis. Always consult a qualified healthcare professional.
        </div>
      </div>

      <ProcessingOverlay open={processing} onComplete={onProcessingComplete} seed={DEMO_SCENARIOS[selectedDemo].waveformSeed} />
    </TooltipProvider>
  );
}
