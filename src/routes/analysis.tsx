import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Upload, FileText, X, CheckCircle2, Sliders, Play, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProcessingOverlay } from "@/components/processing-overlay";
import { useAnalysisStore } from "@/lib/analysis-store";
import { analyzeCSVFile, buildResultFromFeatures } from "@/lib/analyze-csv";
import type { AnalysisResult } from "@/lib/demo-data";
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
  const { setResult } = useAnalysisStore();
  const [processing, setProcessing] = useState(false);
  const [fileLoaded, setFileLoaded] = useState<{ name: string; size: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingResult, setPendingResult] = useState<AnalysisResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [features, setFeatures] = useState({ mean: "", std: "", variance: "", min: "", max: "" });

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const result = await analyzeCSVFile(file);
      setPendingResult(result);
      setFileLoaded({ name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB` });
      toast.success("File validated — ready for analysis");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to read this file.";
      toast.error(message);
      setFileLoaded(null);
      setPendingResult(null);
    } finally {
      setParsing(false);
    }
  };

  const resetFeatures = () => setFeatures({ mean: "", std: "", variance: "", min: "", max: "" });

  const clearFile = () => {
    setFileLoaded(null);
    setPendingResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startAnalysis = () => {
    if (fileLoaded && pendingResult) {
      setProcessing(true);
      return;
    }
    // Manual tab: build result from entered features
    const parsed = {
      mean: parseFloat(features.mean),
      std: parseFloat(features.std),
      variance: parseFloat(features.variance),
      min: parseFloat(features.min),
      max: parseFloat(features.max),
    };
    if (Object.values(parsed).some((v) => !Number.isFinite(v))) {
      toast.error("Please enter valid numeric values for all features.");
      return;
    }
    const fingerprint = `${parsed.mean}|${parsed.std}|${parsed.variance}|${parsed.min}|${parsed.max}|${Date.now()}`;
    const result = buildResultFromFeatures(parsed, "manual-entry", fingerprint);
    setPendingResult(result);
    setProcessing(true);
  };

  const onProcessingComplete = () => {
    if (pendingResult) setResult(pendingResult);
    setProcessing(false);
    navigate({ to: "/results" });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">Neural Analysis</div>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">AI Analysis Studio</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Upload your EEG dataset to run intelligent pattern analysis. Every upload is analyzed independently and produces its own report.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl">
            {[
              { k: "AI Engine", v: "Ready", dot: "var(--status-normal)" },
              { k: "Model", v: "Random Forest", dot: "var(--accent-cyan)" },
              { k: "Input Features", v: "5", dot: "var(--accent-blue)" },
              { k: "Classes", v: "4", dot: "var(--status-moderate)" },
            ].map((s) => (
              <div key={s.k} className="glass-card rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} /> {s.k}
                </div>
                <div className="mt-0.5 text-sm font-mono">{s.v}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <Tabs defaultValue="upload" className="mt-8">
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
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
                  <p className="mt-1 text-xs text-muted-foreground">Supported: CSV, TXT · numeric samples · Max 50MB</p>
                  <div className="mt-6 flex justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={parsing}
                    >
                      {parsing ? "Reading file…" : "Choose CSV File"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="rounded-xl border border-status-normal/30 bg-status-normal/5 p-5 flex items-center gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-status-normal/10 border border-status-normal/30 text-status-normal">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium truncate">{fileLoaded.name}</div>
                        <span className="rounded-full bg-status-normal/15 text-status-normal text-[10px] uppercase tracking-widest px-2 py-0.5 border border-status-normal/30 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> File Validated
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">EEG Signal Data · {fileLoaded.size} · Ready for Feature Extraction</div>
                      <div className="mt-2 h-1 rounded-full bg-surface-3 overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-accent-cyan to-accent-blue" />
                      </div>
                    </div>
                    <button aria-label="Remove file" onClick={clearFile} className="grid h-8 w-8 place-items-center rounded-md hover:bg-surface-2 text-muted-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button size="lg" className="bg-accent-cyan text-primary-foreground hover:bg-accent-cyan/90 shadow-glow" onClick={startAnalysis}>
                      <Play className="h-4 w-4 mr-2" /> Begin AI Analysis
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
                  <Button variant="ghost" onClick={resetFeatures}><RotateCcw className="h-4 w-4 mr-2" /> Reset</Button>
                </div>
                <Button
                  size="lg"
                  className="bg-accent-cyan text-primary-foreground hover:bg-accent-cyan/90 shadow-glow"
                  onClick={startAnalysis}
                  disabled={Object.values(features).some((v) => v === "")}
                >
                  <Play className="h-4 w-4 mr-2" /> Analyze Features
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 rounded-xl border border-border/60 bg-surface/40 p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">Note.</strong> SOMNIA AI is an AI-assisted screening tool. Results should not be interpreted as a confirmed medical diagnosis. Always consult a qualified healthcare professional.
        </div>
      </div>

      <ProcessingOverlay
        open={processing}
        onComplete={onProcessingComplete}
        seed={pendingResult?.waveformSeed ?? 1}
      />
    </TooltipProvider>
  );
}
