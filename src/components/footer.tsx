import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-24 bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent-cyan" />
            <span className="text-sm font-semibold">SOMNIA AI</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground max-w-xs leading-relaxed">
            AI-assisted screening of sleep and neurological patterns from EEG-derived features.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Product</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/analysis" className="text-muted-foreground hover:text-foreground">AI Analysis</Link></li>
            <li><Link to="/results" className="text-muted-foreground hover:text-foreground">Results</Link></li>
            <li><Link to="/analytics" className="text-muted-foreground hover:text-foreground">Analytics</Link></li>
            <li><Link to="/history" className="text-muted-foreground hover:text-foreground">History</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Learn</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/technology" className="text-muted-foreground hover:text-foreground">Technology</Link></li>
            <li><Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Disclaimer</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            SOMNIA AI is designed for educational, research, and AI-assisted screening purposes only. Results are not a medical diagnosis.
          </p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SOMNIA AI · Decode Your Sleep. Understand Your Health.
      </div>
    </footer>
  );
}
