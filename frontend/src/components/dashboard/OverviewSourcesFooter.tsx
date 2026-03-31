import { useState } from "react";
import type { DashboardSnapshot } from "@ecovision/shared";

import { cn } from "@/lib/utils";

export const OverviewSourcesFooter = ({ snapshot }: { snapshot: DashboardSnapshot }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isExpanded = isHovered || isPinned;

  return (
    <footer
      className="overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/50 shadow-glow backdrop-blur-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isExpanded ? "grid-rows-[1fr_auto]" : "grid-rows-[0fr_auto]"
        )}
      >
        <div className={cn("overflow-hidden", !isExpanded && "pointer-events-none")}>
          <div className="grid gap-2.5 px-3 pt-3 md:grid-cols-2 xl:grid-cols-4">
            {snapshot.analytics.dataSources.map((source) => (
              <article key={source.id} className="rounded-[18px] border border-white/8 bg-white/5 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-[13px] leading-5 text-white">{source.title}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">{source.variable}</p>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                    Live
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/6 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Remote Sensing Sources</p>
            <p className="mt-1 text-sm text-slate-200">{snapshot.analytics.dataSources.length} live feeds</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPinned((value) => !value)}
            aria-expanded={isExpanded}
            aria-label="Toggle source footer"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
          >
            ^
          </button>
        </div>
      </div>
    </footer>
  );
};
