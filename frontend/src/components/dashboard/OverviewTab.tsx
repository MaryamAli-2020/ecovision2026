import type { ClimateMetric, DashboardSnapshot, SeverityFilter } from "@ecovision/shared";
import { Database, Droplets, Leaf, ThermometerSun } from "lucide-react";

import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { MapPanel } from "@/components/map/MapPanel";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { buildCurrentConditionRows } from "@/lib/dashboard";
import { cn, formatPercent } from "@/lib/utils";

interface OverviewTabProps {
  snapshot: DashboardSnapshot;
  activeMetric: ClimateMetric;
  selectedCityId: string;
  timelineIndex: number;
  severityFilter: SeverityFilter;
  onMetricChange: (metric: ClimateMetric) => void;
  onCitySelect: (cityId: string) => void;
  onTimelineChange: (index: number) => void;
}

export const OverviewTab = ({
  snapshot,
  activeMetric,
  selectedCityId,
  timelineIndex,
  severityFilter,
  onMetricChange,
  onCitySelect,
  onTimelineChange
}: OverviewTabProps) => {
  const conditions = buildCurrentConditionRows(snapshot, severityFilter);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.58fr)_390px]">
      <MapPanel
        snapshot={snapshot}
        activeMetric={activeMetric}
        selectedCityId={selectedCityId}
        timelineIndex={timelineIndex}
        severityFilter={severityFilter}
        onMetricChange={onMetricChange}
        onCitySelect={onCitySelect}
        onTimelineChange={onTimelineChange}
      />

      <aside className="space-y-4 xl:max-h-[calc(100vh-320px)] xl:overflow-y-auto xl:pr-1">
        <KpiGrid snapshot={snapshot} selectedCityId={selectedCityId} timelineIndex={timelineIndex} />

        <GlassPanel
          title="Current Conditions by Emirate"
          contentClassName="space-y-3"
        >
          {conditions.map((entry) => (
            <button
              key={entry.emirateId}
              onClick={() => onCitySelect(entry.emirateId)}
              className={cn(
                "w-full rounded-[20px] border p-3.5 text-left transition",
                entry.emirateId === selectedCityId
                  ? "border-cyan-400/30 bg-cyan-400/10"
                  : "border-white/8 bg-white/5 hover:border-white/15"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-white">{entry.emirate}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {entry.riskLevel} drought severity
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200">
                  {formatPercent(entry.forecastConfidence)}
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2 text-sm text-slate-200">
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <Database className="h-3.5 w-3.5" />
                    SPI
                  </span>
                  <p className="mt-1 text-base text-white">{entry.spi?.toFixed(1) ?? "N/A"}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2 text-sm text-slate-200">
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <Leaf className="h-3.5 w-3.5" />
                    NDVI
                  </span>
                  <p className="mt-1 text-base text-white">{entry.ndvi?.toFixed(2) ?? "N/A"}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2 text-sm text-slate-200">
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <ThermometerSun className="h-3.5 w-3.5" />
                    LST
                  </span>
                  <p className="mt-1 text-base text-white">{entry.lst?.toFixed(1) ?? "N/A"} C</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2 text-sm text-slate-200">
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <Droplets className="h-3.5 w-3.5" />
                    Soil
                  </span>
                  <p className="mt-1 text-base text-white">{entry.soilMoisture?.toFixed(2) ?? "N/A"}</p>
                </div>
              </div>
            </button>
          ))}
        </GlassPanel>

        <GlassPanel
          title="Remote Sensing Sources"
          contentClassName="space-y-3"
        >
          {snapshot.analytics.dataSources.map((source) => (
            <article key={source.id} className="rounded-[20px] border border-white/8 bg-white/5 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base text-white">{source.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{source.geeId}</p>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
                  {source.status}
                </span>
              </div>
              <p className="mt-2.5 text-sm leading-6 text-slate-300">{source.summary}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-[11px] text-slate-300">
                  {source.cadence}
                </span>
                <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-[11px] text-slate-300">
                  Native {source.nativeResolution}
                </span>
                <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-[11px] text-slate-300">
                  Harmonized {source.harmonizedResolution}
                </span>
              </div>
            </article>
          ))}
        </GlassPanel>
      </aside>
    </div>
  );
};
