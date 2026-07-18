import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Activity, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/analysis", label: "AI Analysis" },
  { to: "/results", label: "Results" },
  { to: "/analytics", label: "Analytics" },
  { to: "/technology", label: "Technology" },
  { to: "/history", label: "History" },
  { to: "/about", label: "About" },
] as const;

export function Nav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 backdrop-blur-xl bg-background/75"
          : "border-b border-transparent bg-background/40 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent-cyan/25 to-accent-blue/10 border border-accent-cyan/30">
            <Activity className="h-4 w-4 text-accent-cyan" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-lg animate-[pulse-glow_3s_ease-in-out_infinite] bg-accent-cyan/10" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">SOMNIA <span className="text-accent-cyan">AI</span></div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80 -mt-0.5">Neural Health</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative px-3 py-1.5 text-sm rounded-md transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-md bg-surface-2 border border-border/70"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/analysis" className="hidden sm:inline-flex">
            <Button size="sm" className="bg-accent-cyan text-primary-foreground hover:bg-accent-cyan/90 shadow-glow">
              Start Analysis
            </Button>
          </Link>
          <button
            aria-label="Menu"
            className="lg:hidden grid h-9 w-9 place-items-center rounded-md border border-border bg-surface hover:bg-surface-2"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="lg:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-2.5 rounded-md text-sm ${
                      active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link to="/analysis" className="mt-2">
                <Button className="w-full bg-accent-cyan text-primary-foreground hover:bg-accent-cyan/90">
                  Start Analysis
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
