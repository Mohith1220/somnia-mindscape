import type { AnalysisResult } from "./demo-data";
import { CONDITION_META } from "./demo-data";

const RISK_HEX: Record<string, string> = {
  Low: "#4ade80",
  Medium: "#facc15",
  Moderate: "#fb923c",
  High: "#f97316",
  Critical: "#ef4444",
};

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c),
  );
}

function bar(pct: number, color: string) {
  return `<div class="bar"><div class="bar-fill" style="width:${pct.toFixed(1)}%;background:${color}"></div></div>`;
}

export function buildReportHTML(r: AnalysisResult, opts: { print?: boolean } = {}) {
  const dateStr = new Date(r.timestamp).toLocaleString();
  const winner = CONDITION_META[r.condition];
  const probRows = (["normal", "insomnia", "apnea", "seizure"] as const)
    .map((k) => {
      const meta = CONDITION_META[k];
      const v = r.probabilities[k];
      const isWin = k === r.condition;
      return `<tr>
        <td><span class="dot" style="background:${meta.color.replace("var(--status-normal)", "#4ade80").replace("var(--status-moderate)", "#facc15").replace("var(--status-high)", "#fb923c").replace("var(--status-critical)", "#ef4444")}"></span>${escape(meta.label)}${isWin ? ' <span class="tag">PREDICTED</span>' : ""}</td>
        <td class="right mono">${v.toFixed(1)}%</td>
        <td>${bar(v, isWin ? "#22d3ee" : "#64748b")}</td>
      </tr>`;
    })
    .join("");

  const importanceRows = r.featureImportance
    .map(
      (f, i) => `<tr>
      <td>${escape(f.name)}</td>
      <td class="right mono">${f.value}%</td>
      <td>${bar(f.value, i === 0 ? "#22d3ee" : "#3b82f6")}</td>
    </tr>`,
    )
    .join("");

  const riskColor = RISK_HEX[r.risk] || "#fb923c";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SOMNIA AI — Intelligence Report ${escape(r.id)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: ui-sans-serif, -apple-system, "Segoe UI", Inter, sans-serif; color:#0f172a; background:#f8fafc; }
  .page { max-width: 880px; margin: 0 auto; padding: 40px 48px; background:#fff; }
  header { display:flex; align-items:center; justify-content:space-between; padding-bottom:20px; border-bottom:2px solid #0f172a; }
  .brand { display:flex; align-items:center; gap:10px; }
  .logo { width:36px; height:36px; border-radius:8px; background: linear-gradient(135deg,#0891b2,#1d4ed8); display:grid; place-items:center; color:#fff; font-weight:700; font-family: ui-monospace, Menlo, monospace; }
  .brand-name { font-weight:700; letter-spacing:.02em; }
  .brand-sub { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:.15em; }
  .meta { text-align:right; font-size:11px; color:#64748b; font-family: ui-monospace, Menlo, monospace; text-transform:uppercase; letter-spacing:.1em; }
  h1 { margin: 24px 0 4px; font-size: 28px; letter-spacing:-.01em; }
  .lede { color:#475569; font-size: 14px; margin: 0 0 24px; }
  section { margin: 28px 0; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing:.18em; color:#0891b2; margin: 0 0 10px; }
  .card { border:1px solid #e2e8f0; border-radius:12px; padding:16px 18px; background:#fff; }
  .grid { display:grid; grid-template-columns: 2fr 1fr; gap:16px; }
  .kv { display:grid; grid-template-columns: 1fr auto; gap:8px 16px; font-size: 13px; }
  .kv dt { color:#64748b; }
  .kv dd { margin:0; font-family: ui-monospace, Menlo, monospace; }
  .headline { font-size: 26px; font-weight: 700; letter-spacing:-.01em; }
  .conf { display:flex; align-items:baseline; gap:8px; }
  .conf .n { font-size: 36px; font-weight: 700; color:#0891b2; font-family: ui-monospace, Menlo, monospace; }
  .risk { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; font-size: 12px; font-weight: 600; color:${riskColor}; background:${riskColor}22; border:1px solid ${riskColor}55; }
  table { width:100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 6px; border-bottom:1px solid #e2e8f0; text-align:left; vertical-align: middle; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing:.12em; color:#64748b; font-weight: 600; }
  td.right, th.right { text-align:right; }
  .mono { font-family: ui-monospace, Menlo, monospace; }
  .dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:8px; vertical-align: middle; }
  .tag { font-size:9px; letter-spacing:.15em; text-transform:uppercase; color:#0891b2; margin-left:8px; }
  .bar { position:relative; height:6px; background:#e2e8f0; border-radius:999px; width: 140px; overflow:hidden; }
  .bar-fill { position:absolute; inset:0; border-radius:999px; }
  .features { display:grid; grid-template-columns: repeat(5, 1fr); gap:8px; }
  .feat { border:1px solid #e2e8f0; border-radius:8px; padding:10px; }
  .feat .k { font-size:9px; text-transform:uppercase; letter-spacing:.15em; color:#64748b; }
  .feat .v { margin-top:4px; font-family: ui-monospace, Menlo, monospace; font-weight:600; font-size:15px; }
  .insight { border-left: 3px solid #22d3ee; padding: 6px 12px; margin: 8px 0; background: #f0fdff; color:#0f172a; font-size:13px; line-height:1.55; }
  .insight strong { display:block; text-transform:uppercase; font-size:10px; letter-spacing:.15em; color:#0891b2; margin-bottom:4px; }
  ul.recs { margin:8px 0 0; padding-left: 20px; font-size:13px; line-height:1.65; }
  .disclaimer { margin-top: 32px; border:1px solid #fca5a5; background:#fef2f2; border-radius:12px; padding:14px 16px; color:#7f1d1d; font-size:12px; line-height:1.55; }
  .disclaimer strong { display:block; text-transform:uppercase; letter-spacing:.12em; font-size:11px; margin-bottom:4px; }
  footer { margin-top:36px; padding-top:14px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:11px; color:#94a3b8; font-family: ui-monospace, Menlo, monospace; }
  .actions { position: sticky; top:0; background:#f8fafc; padding:12px 16px; display:flex; gap:8px; justify-content:flex-end; border-bottom:1px solid #e2e8f0; }
  .btn { border:1px solid #cbd5e1; background:#fff; padding:6px 14px; border-radius:8px; font-size:13px; cursor:pointer; }
  .btn.primary { background:#0891b2; color:#fff; border-color:#0891b2; }
  @media print {
    .actions { display:none; }
    body { background:#fff; }
    .page { padding: 24px; box-shadow:none; }
  }
</style>
</head>
<body>
  <div class="actions">
    <button class="btn" onclick="window.close()">Close</button>
    <button class="btn primary" onclick="window.print()">Print / Save PDF</button>
  </div>
  <div class="page">
    <header>
      <div class="brand">
        <div class="logo">S</div>
        <div>
          <div class="brand-name">SOMNIA AI</div>
          <div class="brand-sub">Neural Health Intelligence</div>
        </div>
      </div>
      <div class="meta">
        <div>Report ${escape(r.id)}</div>
        <div>${escape(dateStr)}</div>
      </div>
    </header>

    <h1>AI Health Intelligence Report</h1>
    <p class="lede">Machine learning-assisted analysis of EEG-derived neural signal patterns.</p>

    <section>
      <h2>Screening Result</h2>
      <div class="card grid">
        <div>
          <div class="headline">${escape(winner.label)}</div>
          <div class="conf" style="margin-top:6px;">
            <span class="n">${r.confidence.toFixed(1)}%</span>
            <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.12em;">Prediction Confidence</span>
          </div>
          <div style="margin-top:10px;">
            <span class="risk">Risk · ${escape(r.risk)}</span>
          </div>
        </div>
        <dl class="kv">
          <dt>Analysis ID</dt><dd>${escape(r.id)}</dd>
          <dt>Signal Type</dt><dd>EEG-Derived</dd>
          <dt>Primary Model</dt><dd>Random Forest</dd>
          <dt>Features</dt><dd>5</dd>
        </dl>
      </div>
    </section>

    <section>
      <h2>Class Probability</h2>
      <div class="card">
        <table>
          <thead><tr><th>Class</th><th class="right">Probability</th><th></th></tr></thead>
          <tbody>${probRows}</tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>EEG Feature Summary</h2>
      <div class="features">
        <div class="feat"><div class="k">Mean</div><div class="v">${r.features.mean.toFixed(2)}</div></div>
        <div class="feat"><div class="k">Std Dev</div><div class="v">${r.features.std.toFixed(2)}</div></div>
        <div class="feat"><div class="k">Variance</div><div class="v">${r.features.variance.toFixed(2)}</div></div>
        <div class="feat"><div class="k">Min</div><div class="v">${r.features.min.toFixed(2)}</div></div>
        <div class="feat"><div class="k">Max</div><div class="v">${r.features.max.toFixed(2)}</div></div>
      </div>
    </section>

    <section>
      <h2>Signal Profile</h2>
      <div class="card">
        <dl class="kv">
          <dt>Samples Processed</dt><dd>${r.signalProfile?.sampleCount ?? r.signalSamples?.length ?? 0}</dd>
          <dt>Abnormal Peaks</dt><dd>${r.signalProfile?.peakCount ?? 0}</dd>
          <dt>Zero Crossings</dt><dd>${r.signalProfile?.zeroCrossings ?? 0}</dd>
          <dt>Peak-to-Peak</dt><dd>${(r.signalProfile?.peakToPeak ?? (r.features.max - r.features.min)).toFixed(1)}</dd>
          <dt>Volatility</dt><dd>${(r.signalProfile?.volatility ?? 0).toFixed(2)}</dd>
          <dt>Instability</dt><dd>${r.signalProfile?.instability ?? 0}/100</dd>
        </dl>
      </div>
    </section>

    <section>
      <h2>Feature Contribution</h2>
      <div class="card">
        <table>
          <thead><tr><th>Feature</th><th class="right">Weight</th><th></th></tr></thead>
          <tbody>${importanceRows}</tbody>
        </table>
        <p style="font-size:11px;color:#64748b;margin:10px 0 0;font-style:italic;">Feature influence reflects model contribution and does not establish medical causation.</p>
      </div>
    </section>

    <section>
      <h2>AI Insight Summary</h2>
      <div class="insight"><strong>Pattern</strong>${escape(r.insights.pattern)}</div>
      <div class="insight"><strong>Model Confidence</strong>${escape(r.insights.risk)}</div>
      <div class="insight"><strong>Next Step</strong>${escape(r.insights.nextStep)}</div>
    </section>

    <section>
      <h2>General Wellness Guidance</h2>
      <div class="card">
        <ul class="recs">
          ${r.recommendations.map((x) => `<li>${escape(x)}</li>`).join("")}
        </ul>
      </div>
    </section>

    <div class="disclaimer">
      <strong>Medical Disclaimer</strong>
      SOMNIA AI is an AI-assisted screening and research tool. Results generated by this system should not be interpreted as a confirmed medical diagnosis. Always consult a qualified healthcare professional for medical evaluation and treatment.
    </div>

    <footer>
      <div>SOMNIA AI · Intelligence Report</div>
      <div>${escape(r.id)}</div>
    </footer>
  </div>
  ${opts.print ? "<script>window.addEventListener('load', () => setTimeout(() => window.print(), 350));</script>" : ""}
</body>
</html>`;
}

export function openReport(r: AnalysisResult, print = false) {
  const html = buildReportHTML(r, { print });
  const w = window.open("", "_blank", "noopener,noreferrer,width=960,height=1000");
  if (!w) {
    // Fallback: download as HTML file
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SOMNIA_Report_${r.id}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function downloadReport(r: AnalysisResult) {
  const html = buildReportHTML(r);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SOMNIA_Report_${r.id}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
