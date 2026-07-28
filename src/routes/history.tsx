import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowUpDown, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildResultFromFeatures } from "@/lib/analyze-csv";
import { CONDITION_META, HISTORY_RECORDS, RISK_COLOR, type ConditionKey, type Features, type RiskLevel } from "@/lib/demo-data";
import { useAnalysisStore } from "@/lib/analysis-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Analysis History — SOMNIA AI" },
      { name: "description", content: "Browse and revisit previous AI-assisted screening analyses." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [q, setQ] = useState("");
  const [condFilter, setCondFilter] = useState<"all" | ConditionKey>("all");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
  const [sortAsc, setSortAsc] = useState(false);
  const navigate = useNavigate();
  const setResult = useAnalysisStore((s) => s.setResult);

  const rows = useMemo(() => {
    let r = [...HISTORY_RECORDS];
    if (condFilter !== "all") r = r.filter((x) => x.condition === condFilter);
    if (riskFilter !== "all") r = r.filter((x) => x.risk === riskFilter);
    if (q) r = r.filter((x) => x.id.toLowerCase().includes(q.toLowerCase()) || CONDITION_META[x.condition].label.toLowerCase().includes(q.toLowerCase()));
    r.sort((a, b) => sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return r;
  }, [q, condFilter, riskFilter, sortAsc]);

  const openRecord = (record: (typeof HISTORY_RECORDS)[number]) => {
    const features = historicalFeatures(record);
    const result = buildResultFromFeatures(features, record.id, `${record.id}|${record.date}|history`, historicalSignal(features, record.condition));
    setResult({
      ...result,
      id: record.id,
      timestamp: new Date(record.date).toISOString(),
    });
    navigate({ to: "/results" });
  };

  const summary = useMemo(() => {
    const total = HISTORY_RECORDS.length;
    const latest = HISTORY_RECORDS.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    const avg = HISTORY_RECORDS.reduce((s, x) => s + x.confidence, 0) / total;
    return { total, latestDate: latest?.date ?? "—", latestLabel: latest ? CONDITION_META[latest.condition].label : "—", avg };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">History</div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Screening Timeline</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Review previous AI-assisted screening analyses and reopen any record.</p>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Analyses</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{summary.total}</div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Latest Screening</div>
          <div className="mt-2 text-lg font-semibold">{summary.latestLabel}</div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">{summary.latestDate}</div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Average Confidence</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-accent-cyan">{summary.avg.toFixed(1)}%</div>
        </div>
      </div>

      <div className="mt-8 glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by ID or condition..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 bg-surface" />
        </div>
        <Select value={condFilter} onValueChange={(v) => setCondFilter(v as typeof condFilter)}>
          <SelectTrigger className="w-40 bg-surface"><SelectValue placeholder="Condition" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All conditions</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="insomnia">Insomnia</SelectItem>
            <SelectItem value="apnea">Sleep Apnea</SelectItem>
            <SelectItem value="seizure">Seizure</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as typeof riskFilter)}>
          <SelectTrigger className="w-36 bg-surface"><SelectValue placeholder="Risk" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risks</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Moderate">Moderate</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setSortAsc((s) => !s)}>
          <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" /> Date {sortAsc ? "↑" : "↓"}
        </Button>
      </div>

      <div className="mt-4 glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="py-3 px-4 font-medium">Analysis ID</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Detected Condition</th>
                <th className="py-3 px-4 font-medium">Confidence</th>
                <th className="py-3 px-4 font-medium">Risk</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const c = CONDITION_META[r.condition];
                return (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-surface-2/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs">{r.id}</td>
                    <td className="py-3 px-4 text-muted-foreground">{r.date}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                        {c.label}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">{r.confidence.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: `${RISK_COLOR[r.risk]}55`, background: `${RISK_COLOR[r.risk]}18`, color: RISK_COLOR[r.risk] }}>
                        {r.risk}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => openRecord(r)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No matching analyses.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function historicalFeatures(record: (typeof HISTORY_RECORDS)[number]): Features {
  const n = Number(record.id.replace(/\D/g, "").slice(-3)) || 1;
  const offset = (n % 17) / 10;
  const profiles: Record<ConditionKey, Features> = {
    normal: { mean: 0.15 + offset * 0.08, std: 8.5 + offset, variance: 72 + n % 60, min: -22 - (n % 16), max: 24 + (n % 18) },
    insomnia: { mean: 1.4 + offset * 0.4, std: 15.5 + (n % 9), variance: 230 + (n % 180), min: -48 - (n % 22), max: 52 + (n % 24) },
    apnea: { mean: 0.5 + offset * 0.3, std: 24 + (n % 12), variance: 520 + (n % 420), min: -82 - (n % 26), max: 86 + (n % 28) },
    seizure: { mean: 3 + offset, std: 48 + (n % 24), variance: 2500 + (n % 1600), min: -150 - (n % 36), max: 165 + (n % 42) },
  };
  return profiles[record.condition];
}

function historicalSignal(features: Features, condition: ConditionKey) {
  const out: number[] = [];
  const amplitude = Math.max(Math.abs(features.min), Math.abs(features.max), features.std * 2);
  for (let i = 0; i < 160; i++) {
    let v = features.mean + Math.sin(i * 0.21) * amplitude * 0.34 + Math.sin(i * 0.73) * features.std * 0.42;
    if (condition === "apnea" && i % 41 > 31) v += (i % 2 ? -1 : 1) * amplitude * 0.52;
    if (condition === "seizure" && (i % 37 === 0 || i % 43 === 0)) v += (i % 2 ? -1 : 1) * amplitude * 0.96;
    out.push(v);
  }
  return out;
}
