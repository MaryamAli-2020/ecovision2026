import type { ClimateMetric, DashboardSnapshot, SeverityFilter } from "@ecovision/shared";
import { CloudSun, Database, Droplets, Leaf, ShieldAlert, ThermometerSun, Wind } from "lucide-react";

import { EmirateCarousel } from "@/components/dashboard/EmirateCarousel";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { OverviewSourcesFooter } from "@/components/dashboard/OverviewSourcesFooter";
import { MapPanel } from "@/components/map/MapPanel";
import { calculatePointRiskScore, getTimelinePoint } from "@/lib/dashboard";
import { formatPercent, riskBadgeClasses } from "@/lib/utils";

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

const buildWeatherLabel = (lst: number | null | undefined, soilMoisture: number | null | undefined) => {
  if ((lst ?? 0) >= 43) {
    return "Extreme heat";
  }

  if ((lst ?? 0) >= 39 && (soilMoisture ?? 1) < 0.2) {
    return "Hot and dry";
  }

  if ((lst ?? 0) >= 37) {
    return "Warm haze";
  }

  if ((soilMoisture ?? 0) >= 0.28) {
    return "Coastal relief";
  }

  return "Stable conditions";
};

const buildWeatherNote = (lst: number | null | undefined, soilMoisture: number | null | undefined) => {
  if ((lst ?? 0) >= 43) {
    return "Urban heat still dominant";
  }

  if ((soilMoisture ?? 1) < 0.2) {
    return "Dry surface profile";
  }

  return "Balanced surface moisture";
};

export const OverviewTab = ({
  snapshot,
  activeMetric,
  selectedCityId,
  timelineIndex,
  severityFilter,
  onMetricChange,
  onCitySelect,
  onTimelineChange
}: OverviewTabProps) => (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.58fr)_390px] xl:items-stretch">
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

        <aside className="space-y-4 xl:grid xl:h-full xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)] xl:overflow-hidden xl:pr-1">
          <KpiGrid snapshot={snapshot} selectedCityId={selectedCityId} timelineIndex={timelineIndex} />

          <EmirateCarousel
            title="Current Conditions by Emirate"
            items={snapshot.cities}
            activeId={selectedCityId}
            onSelect={onCitySelect}
            slideClassName="h-full"
            renderSlide={(city) => {
              const point = getTimelinePoint(city, timelineIndex);
              const weatherLabel = buildWeatherLabel(point.lst, point.soilMoisture);
              const weatherNote = buildWeatherNote(point.lst, point.soilMoisture);

              return (
                <article className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-y-auto overflow-x-hidden rounded-[22px] border border-white/8 bg-white/5 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-[1.75rem] leading-none text-white">{city.emirate}</p>
                      <p className="mt-1 text-[13px] text-slate-400">{city.region}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ring-1 ${riskBadgeClasses[point.riskLevel]}`}>
                      {point.riskLevel}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
                    <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 p-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <CloudSun className="h-4 w-4" />
                        <span className="text-[11px] uppercase tracking-[0.18em]">Weather</span>
                      </div>
                      <p className="mt-2 font-display text-base text-white">{weatherLabel}</p>
                      <p className="mt-1 text-[13px] text-slate-300">{weatherNote}</p>
                    </div>

                    <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 p-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <ShieldAlert className="h-4 w-4" />
                        <span className="text-[11px] uppercase tracking-[0.18em]">Drought</span>
                      </div>
                      <p className="mt-2 font-display text-base text-white">SPI {point.spi?.toFixed(1) ?? "N/A"}</p>
                      <p className="mt-1 text-[13px] text-slate-300">
                        Confidence {formatPercent(point.forecastAccuracy)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                    <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 px-3 py-2.5 text-sm text-slate-200">
                      <span className="inline-flex items-center gap-2 text-slate-400">
                        <Database className="h-3.5 w-3.5" />
                        Risk score
                      </span>
                      <p className="mt-1 text-[15px] text-white">{Math.round(calculatePointRiskScore(point))}</p>
                    </div>
                    <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 px-3 py-2.5 text-sm text-slate-200">
                      <span className="inline-flex items-center gap-2 text-slate-400">
                        <Wind className="h-3.5 w-3.5" />
                        Rainfall deficit
                      </span>
                      <p className="mt-1 text-[15px] text-white">{point.rainfallDeficit?.toFixed(0) ?? "N/A"} mm</p>
                    </div>
                    <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 px-3 py-2.5 text-sm text-slate-200">
                      <span className="inline-flex items-center gap-2 text-slate-400">
                        <Leaf className="h-3.5 w-3.5" />
                        NDVI
                      </span>
                      <p className="mt-1 text-[15px] text-white">{point.ndvi?.toFixed(2) ?? "N/A"}</p>
                    </div>
                    <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 px-3 py-2.5 text-sm text-slate-200">
                      <span className="inline-flex items-center gap-2 text-slate-400">
                        <ThermometerSun className="h-3.5 w-3.5" />
                        LST
                      </span>
                      <p className="mt-1 text-[15px] text-white">{point.lst?.toFixed(1) ?? "N/A"} C</p>
                    </div>
                    <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 px-3 py-2.5 text-sm text-slate-200 [grid-column:1/-1]">
                      <span className="inline-flex items-center gap-2 text-slate-400">
                        <Droplets className="h-3.5 w-3.5" />
                        Soil moisture
                      </span>
                      <p className="mt-1 text-[15px] text-white">{point.soilMoisture?.toFixed(2) ?? "N/A"}</p>
                    </div>
                  </div>
                </article>
              );
            }}
          />
        </aside>
      </div>

      <OverviewSourcesFooter snapshot={snapshot} />
    </div>
);
