import type { DashboardSnapshot } from "@ecovision/shared";

export const OverviewSourcesFooter = ({ snapshot }: { snapshot: DashboardSnapshot }) => (
  <footer className="rounded-[22px] border border-white/10 bg-slate-950/50 px-3 py-2.5 shadow-glow backdrop-blur-xl">
    <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
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
  </footer>
);
