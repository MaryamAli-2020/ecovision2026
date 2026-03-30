import { Activity, DatabaseZap, ShieldAlert, Waves } from "lucide-react";

import { cn, riskBadgeClasses } from "@/lib/utils";

interface HeaderProps {
  mode: "demo" | "live";
  healthReady: boolean;
  criticalSignals: number;
  onOpenConnect: () => void;
  onSwitchDemo: () => void;
  onSwitchLive: () => void;
}

export const Header = ({
  mode,
  healthReady,
  criticalSignals,
  onOpenConnect,
  onSwitchDemo,
  onSwitchLive
}: HeaderProps) => (
  <header className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/60 backdrop-blur-2xl">
    <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-glow">
          <Waves className="h-5 w-5 text-slate-950" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display text-xl text-white">EcoVision UAE 2026</p>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ring-1",
                mode === "live" ? "bg-cyan-500/15 text-cyan-200 ring-cyan-400/30" : riskBadgeClasses.moderate
              )}
            >
              {mode === "live" ? "Live Data" : "Demo Mode"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-400">
            Multimodal AI climate intelligence for autonomous resilience decisions
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {criticalSignals > 0 ? (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 shadow-ember">
            <ShieldAlert className="h-4 w-4 text-rose-200" />
            {criticalSignals} critical
          </div>
        ) : null}
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
          <Activity className={cn("h-4 w-4", healthReady ? "text-emerald-300" : "text-amber-300")} />
          {healthReady ? "Backend ready" : "Checking"}
        </div>
        <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-semibold transition",
              mode === "demo" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
            )}
            onClick={onSwitchDemo}
          >
            Demo
          </button>
          <button
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-semibold transition",
              mode === "live" ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:text-white"
            )}
            onClick={onSwitchLive}
          >
            Live Data
          </button>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
          onClick={onOpenConnect}
        >
          <DatabaseZap className="h-4 w-4" />
          Connect Data
        </button>
      </div>
    </div>
  </header>
);
