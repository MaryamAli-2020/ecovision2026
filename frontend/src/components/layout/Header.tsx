import { Activity, DatabaseZap, ShieldAlert } from "lucide-react";

import { cn, riskBadgeClasses } from "@/lib/utils";

interface HeaderProps {
  className?: string;
  mode: "demo" | "live";
  healthReady: boolean;
  criticalSignals: number;
  onOpenConnect: () => void;
  onSwitchDemo: () => void;
  onSwitchLive: () => void;
}

export const Header = ({
  className,
  mode,
  healthReady,
  criticalSignals,
  onOpenConnect,
  onSwitchDemo,
  onSwitchLive
}: HeaderProps) => (
  <header className={cn("border-b border-white/8 bg-slate-950/60 backdrop-blur-2xl", className)}>
    <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-2 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <p className="truncate font-display text-lg text-white lg:text-[1.15rem]">EcoVision UAE 2026</p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] ring-1",
            mode === "live" ? "bg-cyan-500/15 text-cyan-200 ring-cyan-400/30" : riskBadgeClasses.moderate
          )}
        >
          {mode === "live" ? "Live Data" : "Demo Mode"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {criticalSignals > 0 ? (
          <div className="flex items-center gap-1.5 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-rose-100 shadow-ember">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-200" />
            {criticalSignals} critical
          </div>
        ) : null}
        <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-300">
          <Activity className={cn("h-3.5 w-3.5", healthReady ? "text-emerald-300" : "text-amber-300")} />
          {healthReady ? "Backend ready" : "Checking"}
        </div>
        <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
            className={cn(
              "rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition",
              mode === "demo" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
            )}
            onClick={onSwitchDemo}
          >
            Demo
          </button>
          <button
            className={cn(
              "rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition",
              mode === "live" ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:text-white"
            )}
            onClick={onSwitchLive}
          >
            Live Data
          </button>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
          onClick={onOpenConnect}
        >
          <DatabaseZap className="h-3.5 w-3.5" />
          Connect Data
        </button>
      </div>
    </div>
  </header>
);
