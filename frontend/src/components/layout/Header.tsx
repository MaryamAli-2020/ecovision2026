import { Activity, DatabaseZap, ShieldAlert, Sparkles, Waves } from "lucide-react";

import { cn, riskBadgeClasses } from "@/lib/utils";

interface HeaderProps {
  mode: "demo" | "live";
  healthReady: boolean;
  criticalSignals: number;
  sourceCount: number;
  modelLabel: string;
  onOpenConnect: () => void;
  onSwitchDemo: () => void;
  onSwitchLive: () => void;
}

export const Header = ({
  mode,
  healthReady,
  criticalSignals,
  sourceCount,
  modelLabel,
  onOpenConnect,
  onSwitchDemo,
  onSwitchLive
}: HeaderProps) => (
  <header className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/50 backdrop-blur-2xl">
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 py-4 lg:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-glow">
            <Waves className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-2xl text-white">EcoVision UAE 2026</p>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ring-1",
                  mode === "live" ? "bg-cyan-500/15 text-cyan-200 ring-cyan-400/30" : riskBadgeClasses.moderate
                )}
              >
                {mode === "live" ? "Live Data" : "Demo Mode"}
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">
              Multimodal AI & Generative Visual Analytics for Autonomous Climate Resilience
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {criticalSignals > 0 ? (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 shadow-ember">
              <ShieldAlert className="h-4 w-4 text-rose-200" />
              {criticalSignals} critical signal{criticalSignals > 1 ? "s" : ""}
            </div>
          ) : null}
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            <Activity className={cn("h-4 w-4", healthReady ? "text-emerald-300" : "text-amber-300")} />
            {healthReady ? "Backend ready" : "Checking services"}
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

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="flex items-center gap-3 rounded-[24px] border border-white/8 bg-white/5 px-4 py-3">
          <Sparkles className="h-4 w-4 text-cyan-200" />
          <div>
            <p className="text-sm font-semibold text-white">Ask AI, inspect MSTT forecasts, or connect climate data</p>
            <p className="text-xs text-slate-400">
              Synchronized across remote sensing sources, active Emirate filters, archive windows, and decision-support workflows.
            </p>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
          {sourceCount} remote feeds
        </div>
        <div className="rounded-[24px] border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
          {modelLabel}
        </div>
      </div>
    </div>
  </header>
);
