import { useState } from "react";
import type { DashboardSnapshot } from "@ecovision/shared";

import { cn } from "@/lib/utils";

export const OverviewSourcesFooter = ({ snapshot }: { snapshot: DashboardSnapshot }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <footer className="relative flex justify-end">
      <div
        className={cn(
          "absolute bottom-full right-0 z-20 mb-2 w-full max-w-sm transition-all duration-200 ease-out",
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        )}
      >
        <div className="rounded-[22px] bg-slate-950/95 p-3 shadow-glow backdrop-blur-xl">
          <div className="space-y-2">
            {snapshot.analytics.dataSources.map((source) => (
              <article key={source.id} className="rounded-[18px] bg-white/5 px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-[13px] leading-5 text-white">{source.title}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">{source.variable}</p>
                  </div>
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                    Live
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-label="Toggle source footer"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-lg font-semibold text-slate-200 shadow-glow transition hover:bg-white/10 hover:text-white"
      >
        ^
      </button>
    </footer>
  );
};
