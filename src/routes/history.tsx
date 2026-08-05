import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowUpDown, Eye, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONDITION_META, RISK_COLOR, type ConditionKey, type RiskLevel } from "@/lib/analysis-types";
import { useAnalysisStore } from "@/lib/analysis-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Analysis History — SOMNIA AI" },
      { name: "description", content: "Browse and reopen your previous Random Forest screening analyses." },
      { property: "og:title", content: "Analysis History — SOMNIA AI" },
      { property: "og:description", content: "Browse and reopen your previous Random Forest screening analyses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [q, setQ] = useState("");
  const [condFilter, setCondFilter] = useState<"all" | ConditionKey>("all");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const history = useAnalysisStore((s) => s.history);
  const openFromHistory = useAnalysisStore((s) => s.openFromHistory);
  const clearHistory = useAnalysisStore((s) => s.clearHistory);

  useEffect(() => setMounted(true), []);
  const records = mounted ? history : [];

  const rows = useMemo(() => {
    let r = [...records];
    if (condFilter !== "all") r = r.filter((x) => x.condition === condFilter);
    if (riskFilter !== "all") r = r.filter((x) => x.risk === riskFilter);
    if (q) {
      const needle = q.toLowerCase();
      r = r.filter(
        (x) =>
          x.id.toLowerCase().includes(needle) ||
          x.sourceName.toLowerCase().includes(needle) ||
          CONDITION_META[x.condition].label.toLowerCase().includes(needle),
      );
    }
    r.sort((a, b) => (sortAsc ? a.timestamp.localeCompare(b.timestamp) : b.timestamp.localeCompare(a.timestamp)));
    return r;
  }, [records, q, condFilter, riskFilter, sortAsc]);

  const openRecord = (id: string) => {
    openFromHistory(id);
    navigate({ to: "/results" });
  };

  const summary = useMemo(() => {
    if (!records.length) return { total: 0, latestDate: "—", latestLabel: "—", avg: 0 };
    const latest = [...records].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
    return {
      total: records.length,
      latestDate: new Date(latest.timestamp).toLocaleString(),
      latestLabel: CONDITION_META[latest.condition].label,
      avg: records.reduce((s, x) => s + x.confidence, 0) / records.length,
    };
  }, [records]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[11px] font-mono uppercase tracking-widest text-accent-cyan">History</div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Screening Timeline</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every analysis you run through the Random Forest engine is stored on this device. Reopen any record to view its full report.
        </p>
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
          <div className="mt-2 text-3xl font-semibold tabular-nums text-accent-cyan">
            {summary.total ? `${summary.avg.toFixed(1)}%` : "—"}
          </div>
        </div>
      </div>

      <div className="mt-8 glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by ID, file or condition..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 bg-surface" />
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
        <Button variant="ghost" size="sm" disabled={!records.length} onClick={clearHistory}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear
        </Button>
      </div>

      <div className="mt-4 glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="py-3 px-4 font-medium">Analysis ID</th>
                <th className="py-3 px-4 font-medium">Source</th>
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
                    <td className="py-3 px-4 max-w-[220px] truncate text-muted-foreground">{r.sourceName}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</td>
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
                      <Button size="sm" variant="outline" onClick={() => openRecord(r.id)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-sm text-muted-foreground">
                    {records.length === 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <div>No analyses yet — run your first EEG dataset through the engine.</div>
                        <Button asChild size="sm" className="bg-accent-cyan text-primary-foreground hover:bg-accent-cyan/90">
                          <Link to="/analysis"><Upload className="h-3.5 w-3.5 mr-1.5" /> Open Analysis Studio</Link>
                        </Button>
                      </div>
                    ) : (
                      "No matching analyses."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
