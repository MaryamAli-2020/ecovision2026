import type { DashboardSnapshot } from "@ecovision/shared";

export const OverviewSourcesFooter = ({ snapshot }: { snapshot: DashboardSnapshot }) => (
  <footer className="rounded-[24px] border border-white/10 bg-slate-950/50 px-4 py-3 shadow-glow backdrop-blur-xl">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {snapshot.analytics.dataSources.map((source) => (
        <article key={source.id} className="rounded-[20px] border border-white/8 bg-white/5 px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-sm text-white">{source.title}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{source.variable}</p>
            </div>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Live-ready
            </span>
          </div>
        </article>
      ))}
    </div>
  </footer>
);
